import { useEffect, useCallback } from 'react';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  preventDefault?: boolean;
}

// Native shortcuts that should always be allowed in text inputs
const NATIVE_TEXT_SHORTCUTS = new Set(['a', 'c', 'v', 'x', 'z', 'y']);

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isTextInput = target.tagName === 'TEXTAREA' || 
                        target.tagName === 'INPUT' || 
                        target.isContentEditable;

    // Allow native text editing shortcuts (Ctrl/Cmd + A/C/V/X) in text inputs
    // unless we have a specific custom handler for them
    if (isTextInput && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      const key = e.key.toLowerCase();
      if (NATIVE_TEXT_SHORTCUTS.has(key)) {
        // Check if we have a custom handler for this shortcut
        const hasCustomHandler = shortcuts.some(
          s => s.key.toLowerCase() === key && s.ctrl && !s.shift && !s.alt
        );
        // If no custom handler, let native behavior happen
        if (!hasCustomHandler) {
          return;
        }
      }
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
        shortcut.handler();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}


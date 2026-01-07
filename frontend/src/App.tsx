import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Editor, EditorRef } from './components/Editor';
import { Preview } from './components/Preview';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { ToastContainer, ToastMessage, createToast } from './components/Toast';
import { InsertDialog } from './components/InsertDialog';
import { AIEnhanceDialog } from './components/AIEnhanceDialog';
import { ExportPDFDialog } from './components/ExportPDFDialog';
import { SettingsDialog, AISettings, DEFAULT_SETTINGS } from './components/SettingsDialog';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDebounce } from './hooks/useDebounce';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const DEFAULT_CONTENT = `# Welcome to OV MarkDown AI Editor

This is a **powerful** markdown editor with *live preview* and AI-powered suggestions.

## Features

- Real-time preview as you type
- Clean, modern dark interface
- AI-powered writing enhancements
- **Select text to see AI enhance option!**
- Keyboard shortcuts for power users
- Auto-save to local storage
- Export your work as Markdown

## Getting Started

Start writing your markdown content on the left, and see it rendered in real-time on the right.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+K | Insert Link |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+S | Save |

### Code Example

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

> Try selecting some text and clicking "Enhance" to get AI suggestions!

---

*Happy writing!*
`;

const STORAGE_KEY = 'markdown-editor-content';
const THEME_KEY = 'markdown-editor-theme';
const SETTINGS_KEY = 'markdown-editor-settings';
const MAX_HISTORY = 50;

export default function App() {
  // Theme state
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>(THEME_KEY, 'dark');
  
  // AI Settings state
  const [aiSettings, setAiSettings] = useLocalStorage<AISettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  // Resizer state
  const [editorWidth, setEditorWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  // Content state with localStorage persistence
  const [savedContent, setSavedContent] = useLocalStorage(STORAGE_KEY, DEFAULT_CONTENT);
  const [content, setContent] = useState(savedContent);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // AI loading state
  const [isLoading] = useState(false);

  // AI Enhancement state (unified)
  const [aiEnhance, setAiEnhance] = useState<{
    mode: 'selection' | 'document';
    originalText: string;
    selectionStart?: number;
    selectionEnd?: number;
  } | null>(null);

  // UI state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dialogType, setDialogType] = useState<'link' | 'image' | null>(null);
  const [syncScroll, setSyncScroll] = useState(true);
  const [showExportPDFDialog, setShowExportPDFDialog] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<{ text: string; from: number; to: number } | null>(null);

  // History for undo/redo
  const historyRef = useRef<string[]>([savedContent]);
  const historyIndexRef = useRef(0);
  const isUndoRedoRef = useRef(false);

  // CodeMirror handles undo/redo internally, always enable buttons
  const [canUndo] = useState(true);
  const [canRedo] = useState(true);

  // Editor ref for text manipulation
  const editorRef = useRef<EditorRef>(null);

  // Debounced content for auto-save
  const debouncedContent = useDebounce(content, 1000);

  // Toast management
  const addToast = useCallback((type: ToastMessage['type'], message: string, duration?: number) => {
    const toast = createToast(type, message, duration);
    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    document.body.classList.add('resizing');

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector('.main-content');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      
      // Clamp between 20% and 80%
      setEditorWidth(Math.min(80, Math.max(20, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.classList.remove('resizing');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('resizing');
    };
  }, [isResizing]);

  // Auto-save effect
  useEffect(() => {
    if (debouncedContent !== savedContent) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        setSavedContent(debouncedContent);
        setLastSaved(new Date());
        setIsSaving(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [debouncedContent, savedContent, setSavedContent]);

  // Manual save
  const handleSave = useCallback(() => {
    setSavedContent(content);
    setLastSaved(new Date());
    addToast('success', 'Document saved!', 2000);
  }, [content, setSavedContent, addToast]);

  // Update content with history tracking
  const updateContent = useCallback((newContent: string, skipHistory = false) => {
    setContent(newContent);

    if (!skipHistory && !isUndoRedoRef.current) {
      const currentIndex = historyIndexRef.current;
      historyRef.current = historyRef.current.slice(0, currentIndex + 1);
      historyRef.current.push(newContent);

      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift();
      } else {
        historyIndexRef.current++;
      }

    }
    isUndoRedoRef.current = false;
  }, []);

  const handleUndo = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.undo();
    }
  }, []);

  const handleRedo = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.redo();
    }
  }, []);

  // Get current selection from editor
  const getSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return { start: 0, end: 0, text: '' };
    const sel = editor.getSelection();
    if (!sel) return { start: 0, end: 0, text: '' };
    return {
      start: sel.from,
      end: sel.to,
      text: content.slice(sel.from, sel.to),
    };
  }, [content]);

  // Set cursor/selection in editor
  const setSelection = useCallback((start: number, end: number = start) => {
    const editor = editorRef.current;
    if (editor) {
      // Use setTimeout to ensure content is updated first
      setTimeout(() => {
        editor.setSelection(start, end);
      }, 0);
    }
  }, []);

  // Format handling with toggle support
  const handleFormat = useCallback((type: string) => {
    const { start, end, text: selectedText } = getSelection();

    const formats: Record<string, { prefix: string; suffix: string; placeholder: string; linePrefix?: boolean }> = {
      bold: { prefix: '**', suffix: '**', placeholder: 'bold text' },
      italic: { prefix: '*', suffix: '*', placeholder: 'italic text' },
      code: { prefix: '`', suffix: '`', placeholder: 'code' },
      strikethrough: { prefix: '~~', suffix: '~~', placeholder: 'strikethrough' },
      h1: { prefix: '# ', suffix: '', placeholder: 'Heading 1', linePrefix: true },
      h2: { prefix: '## ', suffix: '', placeholder: 'Heading 2', linePrefix: true },
      h3: { prefix: '### ', suffix: '', placeholder: 'Heading 3', linePrefix: true },
      quote: { prefix: '> ', suffix: '', placeholder: 'quote', linePrefix: true },
      list: { prefix: '- ', suffix: '', placeholder: 'list item', linePrefix: true },
      orderedList: { prefix: '1. ', suffix: '', placeholder: 'list item', linePrefix: true },
      task: { prefix: '- [ ] ', suffix: '', placeholder: 'task', linePrefix: true },
      codeBlock: { prefix: '```\n', suffix: '\n```', placeholder: 'code here' },
      hr: { prefix: '\n---\n', suffix: '', placeholder: '' },
    };

    const format = formats[type];
    if (!format) return;

    const { prefix, suffix, placeholder, linePrefix } = format;

    // Check for toggle (remove formatting)
    if (selectedText) {
      // For inline formats
      if (!linePrefix && suffix) {
        const beforeStart = content.slice(Math.max(0, start - prefix.length), start);
        const afterEnd = content.slice(end, end + suffix.length);

        if (beforeStart === prefix && afterEnd === suffix) {
          const newContent = content.slice(0, start - prefix.length) + selectedText + content.slice(end + suffix.length);
          updateContent(newContent);
          setSelection(start - prefix.length, end - prefix.length);
          return;
        }

        if (selectedText.startsWith(prefix) && selectedText.endsWith(suffix) && selectedText.length > prefix.length + suffix.length) {
          const unwrapped = selectedText.slice(prefix.length, -suffix.length);
          const newContent = content.slice(0, start) + unwrapped + content.slice(end);
          updateContent(newContent);
          setSelection(start, start + unwrapped.length);
          return;
        }
      }

      // For line-prefix formats
      if (linePrefix) {
        let lineStart = start;
        while (lineStart > 0 && content[lineStart - 1] !== '\n') lineStart--;

        const lineContent = content.slice(lineStart, end);

        if (lineContent.startsWith(prefix)) {
          const newContent = content.slice(0, lineStart) + content.slice(lineStart + prefix.length);
          updateContent(newContent);
          setSelection(Math.max(lineStart, start - prefix.length), end - prefix.length);
          return;
        }

        // Replace heading level
        const headingMatch = lineContent.match(/^(#{1,6})\s/);
        if (headingMatch && ['h1', 'h2', 'h3'].includes(type)) {
          const existingPrefix = headingMatch[0];
          const newContent = content.slice(0, lineStart) + prefix + content.slice(lineStart + existingPrefix.length);
          updateContent(newContent);
          const diff = prefix.length - existingPrefix.length;
          setSelection(start + diff, end + diff);
          return;
        }
      }
    }

    // Apply new formatting
    let newContent: string;
    let newStart: number;
    let newEnd: number;

    if (linePrefix) {
      let lineStart = start;
      while (lineStart > 0 && content[lineStart - 1] !== '\n') lineStart--;

      if (selectedText) {
        newContent = content.slice(0, lineStart) + prefix + content.slice(lineStart);
        newStart = start + prefix.length;
        newEnd = end + prefix.length;
      } else {
        newContent = content.slice(0, lineStart) + prefix + placeholder + content.slice(lineStart);
        newStart = lineStart + prefix.length;
        newEnd = lineStart + prefix.length + placeholder.length;
      }
    } else {
      const textToFormat = selectedText || placeholder;
      newContent = content.slice(0, start) + prefix + textToFormat + suffix + content.slice(end);
      newStart = start + prefix.length;
      newEnd = start + prefix.length + textToFormat.length;
    }

    updateContent(newContent);
    setSelection(newStart, newEnd);
  }, [content, getSelection, setSelection, updateContent]);

  // Insert link/image
  const handleInsert = useCallback((text: string, url: string) => {
    const { start, end } = getSelection();
    const isImage = dialogType === 'image';
    const markdown = isImage ? `![${text}](${url})` : `[${text}](${url})`;

    const newContent = content.slice(0, start) + markdown + content.slice(end);
    updateContent(newContent);
    setSelection(start + markdown.length);
    setDialogType(null);
    addToast('success', `${isImage ? 'Image' : 'Link'} inserted!`, 2000);
  }, [content, dialogType, getSelection, setSelection, updateContent, addToast]);

  // Open link dialog
  const handleOpenLinkDialog = useCallback(() => {
    setDialogType('link');
  }, []);

  // Open image dialog
  const handleOpenImageDialog = useCallback(() => {
    setDialogType('image');
  }, []);

  // Track selection changes from editor
  const handleSelectionChange = useCallback((text: string, from: number, to: number) => {
    const hasText = text.length > 2;
    setHasSelection(hasText);
    if (hasText) {
      setCurrentSelection({ text, from, to });
    } else {
      setCurrentSelection(null);
    }
  }, []);

  // Handle selection enhance from editor popup
  const handleEnhanceSelectionPopup = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const sel = editor.getSelection();
    if (!sel) return;

    setAiEnhance({
      mode: 'selection',
      originalText: text,
      selectionStart: sel.from,
      selectionEnd: sel.to,
    });
  }, []);

  // Handle enhance from toolbar button
  const handleEnhanceFromToolbar = useCallback(() => {
    if (!currentSelection || !hasSelection) {
      addToast('warning', 'Please select some text first');
      return;
    }

    setAiEnhance({
      mode: 'selection',
      originalText: currentSelection.text,
      selectionStart: currentSelection.from,
      selectionEnd: currentSelection.to,
    });
  }, [currentSelection, hasSelection, addToast]);

  // Handle enhance document button
  const handleEnhanceDocument = useCallback(() => {
    if (!content.trim()) {
      addToast('warning', 'Please add some content first');
      return;
    }
    setAiEnhance({
      mode: 'document',
      originalText: content,
    });
  }, [content, addToast]);

  // Apply AI enhancement (works for both selection and document)
  const handleApplyAIEnhancement = useCallback((newText: string) => {
    if (!aiEnhance) return;

    if (aiEnhance.mode === 'selection' && aiEnhance.selectionStart !== undefined && aiEnhance.selectionEnd !== undefined) {
      // Apply to selection
      const newContent = 
        content.slice(0, aiEnhance.selectionStart) + 
        newText + 
        content.slice(aiEnhance.selectionEnd);

      updateContent(newContent);
      setSelection(aiEnhance.selectionStart, aiEnhance.selectionStart + newText.length);
      addToast('success', 'Text improved! (Ctrl+Z to undo)', 2000);
    } else {
      // Apply to document
      updateContent(newText);
      addToast('success', 'Document enhanced! (Ctrl+Z to undo)', 2000);
    }
    
    setAiEnhance(null);
  }, [aiEnhance, content, updateContent, setSelection, addToast]);

  // Export as markdown file
  const handleExport = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('success', 'Document exported!', 2000);
  }, [content, addToast]);

  // Export as PDF with options
  const handleExportPDF = useCallback(async (options: { lightMode: boolean; grayscale: boolean; scale: number }) => {
    const previewElement = document.querySelector('.preview-content');
    if (!previewElement) {
      addToast('error', 'Could not find preview content');
      return;
    }

    addToast('info', 'Generating PDF...', 3000);

    const { lightMode, grayscale, scale } = options;
    const scaleFactor = scale / 100;

    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: [15, 15, 15, 15],
        filename: 'document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2 * scaleFactor,
          useCORS: true,
          letterRendering: true,
          backgroundColor: lightMode ? '#ffffff' : '#1a1e27',
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      // Clone the element to avoid modifying the original
      const clone = previewElement.cloneNode(true) as HTMLElement;

      // Colors based on mode
      const colors = lightMode ? {
        bg: '#ffffff',
        bgSecondary: '#f8fafc',
        bgCode: '#f1f5f9',
        text: '#1e293b',
        textSecondary: '#475569',
        textMuted: '#64748b',
        accent: grayscale ? '#1e293b' : '#7c3aed',
        accentSecondary: grayscale ? '#475569' : '#0891b2',
        border: '#e2e8f0',
        blockquoteBg: grayscale ? 'rgba(0,0,0,0.03)' : 'rgba(124, 58, 237, 0.05)',
      } : {
        bg: '#1a1e27',
        bgSecondary: '#13161d',
        bgCode: '#13161d',
        text: '#f4f4f5',
        textSecondary: '#a1a1aa',
        textMuted: '#71717a',
        accent: grayscale ? '#f4f4f5' : '#a78bfa',
        accentSecondary: grayscale ? '#a1a1aa' : '#06b6d4',
        border: 'rgba(255,255,255,0.1)',
        blockquoteBg: grayscale ? 'rgba(255,255,255,0.03)' : 'rgba(139, 92, 246, 0.1)',
      };
      
      // Apply PDF-specific styles with scale
      const baseFontSize = 14 * scaleFactor;
      clone.style.cssText = `
        background: ${colors.bg};
        color: ${colors.text};
        padding: ${20 * scaleFactor}px;
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: ${baseFontSize}px;
        line-height: 1.6;
        max-width: none;
        width: 100%;
        ${grayscale ? 'filter: grayscale(1);' : ''}
      `;

      // Fix heading colors for PDF with scale
      clone.querySelectorAll('h1').forEach((h1) => {
        (h1 as HTMLElement).style.cssText = `color: ${colors.accent}; font-size: ${28 * scaleFactor}px; margin-bottom: ${16 * scaleFactor}px; -webkit-text-fill-color: ${colors.accent}; background: none;`;
      });
      clone.querySelectorAll('h2').forEach((h2) => {
        (h2 as HTMLElement).style.cssText = `color: ${colors.text}; font-size: ${22 * scaleFactor}px; margin-top: ${24 * scaleFactor}px; margin-bottom: ${12 * scaleFactor}px; border-bottom: 1px solid ${colors.border}; padding-bottom: ${8 * scaleFactor}px;`;
      });
      clone.querySelectorAll('h3').forEach((h3) => {
        (h3 as HTMLElement).style.cssText = `color: ${colors.text}; font-size: ${18 * scaleFactor}px; margin-top: ${20 * scaleFactor}px; margin-bottom: ${10 * scaleFactor}px;`;
      });
      clone.querySelectorAll('p').forEach((p) => {
        (p as HTMLElement).style.cssText = `color: ${colors.textSecondary}; margin-bottom: ${12 * scaleFactor}px; font-size: ${baseFontSize}px;`;
      });
      clone.querySelectorAll('li').forEach((li) => {
        (li as HTMLElement).style.cssText = `color: ${colors.textSecondary}; margin-bottom: ${6 * scaleFactor}px; font-size: ${baseFontSize}px;`;
      });
      clone.querySelectorAll('code').forEach((code) => {
        (code as HTMLElement).style.cssText = `background: ${colors.bgCode}; color: ${colors.accent}; padding: ${2 * scaleFactor}px ${6 * scaleFactor}px; border-radius: 4px; font-family: "JetBrains Mono", monospace; font-size: ${13 * scaleFactor}px;`;
      });
      clone.querySelectorAll('pre').forEach((pre) => {
        (pre as HTMLElement).style.cssText = `background: ${colors.bgCode}; padding: ${16 * scaleFactor}px; border-radius: 8px; overflow-x: auto; margin-bottom: ${16 * scaleFactor}px;`;
      });
      clone.querySelectorAll('pre code').forEach((code) => {
        (code as HTMLElement).style.cssText = `background: transparent; color: ${colors.textSecondary}; padding: 0; font-size: ${13 * scaleFactor}px;`;
      });
      clone.querySelectorAll('blockquote').forEach((bq) => {
        (bq as HTMLElement).style.cssText = `border-left: 3px solid ${colors.accent}; background: ${colors.blockquoteBg}; padding: ${12 * scaleFactor}px ${20 * scaleFactor}px; margin: ${16 * scaleFactor}px 0; border-radius: 0 8px 8px 0; font-size: ${baseFontSize}px;`;
      });
      clone.querySelectorAll('table').forEach((table) => {
        (table as HTMLElement).style.cssText = `width: 100%; border-collapse: collapse; margin-bottom: ${16 * scaleFactor}px; font-size: ${baseFontSize}px;`;
      });
      clone.querySelectorAll('th, td').forEach((cell) => {
        (cell as HTMLElement).style.cssText = `padding: ${10 * scaleFactor}px ${14 * scaleFactor}px; border: 1px solid ${colors.border}; text-align: left;`;
      });
      clone.querySelectorAll('th').forEach((th) => {
        (th as HTMLElement).style.cssText += `background: ${colors.bgSecondary}; color: ${colors.text}; font-weight: 600;`;
      });
      clone.querySelectorAll('a').forEach((a) => {
        (a as HTMLElement).style.cssText = `color: ${colors.accentSecondary}; text-decoration: underline;`;
      });
      clone.querySelectorAll('strong').forEach((strong) => {
        (strong as HTMLElement).style.cssText = `color: ${colors.text};`;
      });
      clone.querySelectorAll('em').forEach((em) => {
        (em as HTMLElement).style.cssText = `color: ${colors.accentSecondary};`;
      });
      clone.querySelectorAll('hr').forEach((hr) => {
        (hr as HTMLElement).style.cssText = `border: none; height: 1px; background: ${colors.border}; margin: ${24 * scaleFactor}px 0;`;
      });

      // Remove any copy buttons from code blocks
      clone.querySelectorAll('.code-block-copy, .code-block-header').forEach((el) => {
        el.remove();
      });

      await html2pdf().set(opt).from(clone).save();
      
      addToast('success', 'PDF exported successfully!', 2000);
    } catch (err) {
      console.error('PDF export error:', err);
      addToast('error', 'Failed to export PDF');
    }
  }, [addToast]);

  // Open PDF export dialog
  const handleOpenPDFDialog = useCallback(() => {
    setShowExportPDFDialog(true);
  }, []);

  // Clear content
  const handleClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all content?')) {
      updateContent('');
      addToast('info', 'Content cleared', 2000);
    }
  }, [updateContent, addToast]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      addToast('success', 'Copied to clipboard!', 2000);
    } catch {
      addToast('error', 'Failed to copy');
    }
  }, [content, addToast]);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    { key: 'b', ctrl: true, handler: () => handleFormat('bold') },
    { key: 'i', ctrl: true, handler: () => handleFormat('italic') },
    { key: 'k', ctrl: true, handler: handleOpenLinkDialog },
    { key: 'z', ctrl: true, handler: handleUndo },
    { key: 'y', ctrl: true, handler: handleRedo },
    { key: 'z', ctrl: true, shift: true, handler: handleRedo },
    { key: 's', ctrl: true, handler: handleSave },
    { key: '1', ctrl: true, handler: () => handleFormat('h1') },
    { key: '2', ctrl: true, handler: () => handleFormat('h2') },
    { key: '3', ctrl: true, handler: () => handleFormat('h3') },
    { key: 'e', ctrl: true, handler: handleEnhanceFromToolbar },
  ], [handleFormat, handleOpenLinkDialog, handleUndo, handleRedo, handleSave, handleEnhanceFromToolbar]);

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="app">
      <header className="header">
        <div className="header-top-row">
          <div className="logo">
            <div className="logo-icon">
              <span className="logo-ov">OV</span>
            </div>
            <div className="logo-text">
              <span className="logo-markdown">MarkDown</span>
              <span className="logo-editor">Editor</span>
              <span className="logo-ai">AI</span>
            </div>
          </div>
        </div>
        <Toolbar
          onFormat={handleFormat}
          onEnhanceSelection={handleEnhanceFromToolbar}
          onEnhanceDocument={handleEnhanceDocument}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onInsertLink={handleOpenLinkDialog}
          onInsertImage={handleOpenImageDialog}
          onExport={handleExport}
          onExportPDF={handleOpenPDFDialog}
          onCopy={handleCopy}
          onClear={handleClear}
          onToggleSyncScroll={() => setSyncScroll(!syncScroll)}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setShowSettings(true)}
          canUndo={canUndo}
          canRedo={canRedo}
          isLoading={isLoading}
          syncScroll={syncScroll}
          theme={theme}
          hasSelection={hasSelection}
          hasApiKey={!!aiSettings.apiKey}
        />
      </header>

      <main className="main-content">
        <div className="editor-pane" style={{ width: `${editorWidth}%` }}>
          <Editor
            ref={editorRef}
            value={content}
            onChange={updateContent}
            syncScroll={syncScroll}
            onEnhanceSelection={handleEnhanceSelectionPopup}
            onSelectionChange={handleSelectionChange}
          />
        </div>
        <div 
          className={`resizer ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleResizeStart}
        />
        <div className="preview-pane" style={{ width: `${100 - editorWidth}%` }}>
          <Preview
            content={content}
            syncScroll={syncScroll}
          />
        </div>
      </main>

      <StatusBar
        content={content}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />

      {/* AI Enhancement Dialog (unified for both selection and document) */}
      {aiEnhance && (
        <AIEnhanceDialog
          mode={aiEnhance.mode}
          originalText={aiEnhance.originalText}
          onApply={handleApplyAIEnhancement}
          onClose={() => setAiEnhance(null)}
          aiSettings={aiSettings}
        />
      )}

      {dialogType && (
        <InsertDialog
          type={dialogType}
          selectedText={getSelection().text}
          onInsert={handleInsert}
          onClose={() => setDialogType(null)}
        />
      )}

      {showExportPDFDialog && (
        <ExportPDFDialog
          onExport={handleExportPDF}
          onClose={() => setShowExportPDFDialog(false)}
        />
      )}

      {showSettings && (
        <SettingsDialog
          settings={aiSettings}
          onSave={(newSettings) => {
            setAiSettings(newSettings);
            addToast('success', 'Settings saved!', 2000);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

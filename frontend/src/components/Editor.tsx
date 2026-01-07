import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { defaultKeymap, history, historyKeymap, indentWithTab, undo, redo } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { tags } from '@lezer/highlight';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  syncScroll?: boolean;
  onEnhanceSelection?: (text: string) => void;
  onSelectionChange?: (text: string, from: number, to: number) => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

// Custom theme matching our app's design - subtle and clean
const customTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: 'transparent',
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    padding: '16px 20px',
    caretColor: '#8b5cf6',
    color: '#d4d4d8',
  },
  '.cm-cursor': {
    borderLeftColor: '#8b5cf6',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(139, 92, 246, 0.2) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(139, 92, 246, 0.25) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: '1px solid rgba(255, 255, 255, 0.04)',
    color: 'rgba(255, 255, 255, 0.2)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 12px 0 8px',
    minWidth: '40px',
  },
  '.cm-scroller': {
    overflow: 'auto',
    lineHeight: '1.8',
  },
  '.cm-placeholder': {
    color: 'rgba(255, 255, 255, 0.25)',
    fontStyle: 'italic',
  },
  '.cm-foldGutter': {
    width: '12px',
  },
}, { dark: true });

// Light theme variant
const lightTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: 'transparent',
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    padding: '16px 20px',
    caretColor: '#7c3aed',
    color: '#1e293b',
  },
  '.cm-cursor': {
    borderLeftColor: '#7c3aed',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(124, 58, 237, 0.2) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(124, 58, 237, 0.25) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: '1px solid rgba(0, 0, 0, 0.08)',
    color: 'rgba(0, 0, 0, 0.3)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 12px 0 8px',
    minWidth: '40px',
  },
  '.cm-scroller': {
    overflow: 'auto',
    lineHeight: '1.8',
  },
  '.cm-placeholder': {
    color: 'rgba(0, 0, 0, 0.35)',
    fontStyle: 'italic',
  },
}, { dark: false });

// Markdown syntax highlighting for DARK mode - bright, visible colors
const darkMarkdownHighlightStyle = HighlightStyle.define([
  // Headers - prominent and visible
  { tag: tags.heading1, fontSize: '1.5em', fontWeight: '700', color: '#f4f4f5' },
  { tag: tags.heading2, fontSize: '1.3em', fontWeight: '600', color: '#f4f4f5' },
  { tag: tags.heading3, fontSize: '1.15em', fontWeight: '600', color: '#e4e4e7' },
  { tag: tags.heading4, fontSize: '1.1em', fontWeight: '600', color: '#e4e4e7' },
  { tag: tags.heading5, fontSize: '1.05em', fontWeight: '600', color: '#d4d4d8' },
  { tag: tags.heading6, fontSize: '1em', fontWeight: '600', color: '#d4d4d8' },
  
  // Emphasis - visible
  { tag: tags.strong, fontWeight: '700', color: '#f4f4f5' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#e4e4e7' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#a1a1aa' },
  
  // Code - visible highlight
  { tag: tags.monospace, fontFamily: "'JetBrains Mono', monospace", backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#e4e4e7' },
  
  // Links - visible
  { tag: tags.link, color: '#d4d4d8', textDecoration: 'underline' },
  { tag: tags.url, color: '#a1a1aa', fontSize: '0.95em' },
  
  // Lists
  { tag: tags.list, color: '#e4e4e7' },
  
  // Quotes
  { tag: tags.quote, color: '#d4d4d8', fontStyle: 'italic' },
  
  // Meta (markdown symbols) - subtle but visible
  { tag: tags.processingInstruction, color: '#71717a' },
  { tag: tags.meta, color: '#71717a' },
]);

// Markdown syntax highlighting for LIGHT mode - dark, high contrast colors
const lightMarkdownHighlightStyle = HighlightStyle.define([
  // Headers - dark and prominent
  { tag: tags.heading1, fontSize: '1.5em', fontWeight: '700', color: '#0f172a' },
  { tag: tags.heading2, fontSize: '1.3em', fontWeight: '600', color: '#0f172a' },
  { tag: tags.heading3, fontSize: '1.15em', fontWeight: '600', color: '#1e293b' },
  { tag: tags.heading4, fontSize: '1.1em', fontWeight: '600', color: '#1e293b' },
  { tag: tags.heading5, fontSize: '1.05em', fontWeight: '600', color: '#334155' },
  { tag: tags.heading6, fontSize: '1em', fontWeight: '600', color: '#334155' },
  
  // Emphasis - dark and visible
  { tag: tags.strong, fontWeight: '700', color: '#0f172a' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#1e293b' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#64748b' },
  
  // Code - dark with subtle background
  { tag: tags.monospace, fontFamily: "'JetBrains Mono', monospace", backgroundColor: 'rgba(0, 0, 0, 0.06)', color: '#1e293b' },
  
  // Links - dark
  { tag: tags.link, color: '#334155', textDecoration: 'underline' },
  { tag: tags.url, color: '#475569', fontSize: '0.95em' },
  
  // Lists
  { tag: tags.list, color: '#1e293b' },
  
  // Quotes
  { tag: tags.quote, color: '#334155', fontStyle: 'italic' },
  
  // Meta (markdown symbols) - subtle but visible
  { tag: tags.processingInstruction, color: '#94a3b8' },
  { tag: tags.meta, color: '#94a3b8' },
]);

export interface EditorRef {
  focus: () => void;
  getSelection: () => { from: number; to: number } | null;
  setSelection: (from: number, to?: number) => void;
  insertText: (text: string) => void;
  undo: () => void;
  redo: () => void;
}

export const Editor = forwardRef<EditorRef, EditorProps>(
  function Editor({ value, onChange, syncScroll, onEnhanceSelection, onSelectionChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [lineCount, setLineCount] = useState(1);
    const [isDark, setIsDark] = useState(true);
    const [selectionToolbar, setSelectionToolbar] = useState<{
      x: number;
      y: number;
      text: string;
    } | null>(null);

    // Check theme
    useEffect(() => {
      const checkTheme = () => {
        const theme = document.documentElement.getAttribute('data-theme');
        setIsDark(theme !== 'light');
      };
      checkTheme();
      const observer = new MutationObserver(checkTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      return () => observer.disconnect();
    }, []);

    const handleZoomIn = useCallback(() => {
      setZoom(prev => Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 10) / 10));
    }, []);

    const handleZoomOut = useCallback(() => {
      setZoom(prev => Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 10) / 10));
    }, []);

    // Handle format from selection toolbar
    const handleFormat = useCallback((type: string) => {
      if (!viewRef.current) return;
      
      const view = viewRef.current;
      const { from, to } = view.state.selection.main;
      const selectedText = view.state.doc.sliceString(from, to);
      
      const formats: Record<string, { prefix: string; suffix: string }> = {
        bold: { prefix: '**', suffix: '**' },
        italic: { prefix: '*', suffix: '*' },
        code: { prefix: '`', suffix: '`' },
      };
      
      const format = formats[type];
      if (!format || !selectedText) return;
      
      const { prefix, suffix } = format;
      const wrapped = prefix + selectedText + suffix;
      
      view.dispatch({
        changes: { from, to, insert: wrapped },
        selection: { anchor: from + prefix.length, head: from + prefix.length + selectedText.length },
      });
      view.focus();
      setSelectionToolbar(null);
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => viewRef.current?.focus(),
      getSelection: () => {
        if (!viewRef.current) return null;
        const { from, to } = viewRef.current.state.selection.main;
        return { from, to };
      },
      setSelection: (from: number, to?: number) => {
        if (!viewRef.current) return;
        const view = viewRef.current;
        const docLength = view.state.doc.length;
        // Clamp values to valid range
        const safeFrom = Math.max(0, Math.min(from, docLength));
        const safeTo = Math.max(0, Math.min(to ?? from, docLength));
        view.dispatch({
          selection: { anchor: safeFrom, head: safeTo },
        });
        view.focus();
      },
      insertText: (text: string) => {
        if (!viewRef.current) return;
        const { from, to } = viewRef.current.state.selection.main;
        viewRef.current.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
        });
      },
      undo: () => {
        if (viewRef.current) {
          const view = viewRef.current;
          const scrollTop = view.scrollDOM.scrollTop;
          undo(view);
          // Preserve scroll position
          requestAnimationFrame(() => {
            view.scrollDOM.scrollTop = scrollTop;
            view.focus();
          });
        }
      },
      redo: () => {
        if (viewRef.current) {
          const view = viewRef.current;
          const scrollTop = view.scrollDOM.scrollTop;
          redo(view);
          // Preserve scroll position
          requestAnimationFrame(() => {
            view.scrollDOM.scrollTop = scrollTop;
            view.focus();
          });
        }
      },
    }), []);

    // Initialize CodeMirror
    useEffect(() => {
      if (!editorRef.current) return;

      const checkSelection = () => {
        if (!viewRef.current) return;
        const view = viewRef.current;
        const { from, to } = view.state.selection.main;
        const selectedText = view.state.doc.sliceString(from, to);
        
        // Report selection change to parent
        onSelectionChange?.(selectedText, from, to);
        
        if (selectedText.length > 2 && view.hasFocus) {
          const startCoords = view.coordsAtPos(from);
          const endCoords = view.coordsAtPos(to);
          
          if (startCoords && endCoords) {
            const x = (startCoords.left + endCoords.left) / 2;
            const y = Math.min(startCoords.top, endCoords.top) - 50;
            
            setSelectionToolbar({
              x: Math.max(120, Math.min(x, window.innerWidth - 200)),
              y: Math.max(60, y),
              text: selectedText,
            });
          }
        } else {
          setSelectionToolbar(null);
        }
      };

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          onChange(newValue);
          setLineCount(update.state.doc.lines);
        }
        
        // Handle selection changes for toolbar
        if (update.selectionSet || update.focusChanged) {
          setTimeout(checkSelection, 10);
        }
      });

      // Also listen to mouse events for selection
      const handleMouseUp = () => {
        setTimeout(checkSelection, 10);
      };

      const state = EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          history(),
          foldGutter(),
          drawSelection(),
          dropCursor(),
          indentOnInput(),
          bracketMatching(),
          rectangularSelection(),
          crosshairCursor(),
          EditorState.allowMultipleSelections.of(true),
          markdown({
            base: markdownLanguage,
            codeLanguages: languages,
          }),
          syntaxHighlighting(isDark ? darkMarkdownHighlightStyle : lightMarkdownHighlightStyle),
          isDark ? customTheme : lightTheme,
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            ...foldKeymap,
            indentWithTab,
          ]),
          updateListener,
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': 'Markdown editor' }),
        ],
      });

      const view = new EditorView({
        state,
        parent: editorRef.current,
      });

      viewRef.current = view;
      setLineCount(state.doc.lines);

      // Add mouseup listener for selection detection
      view.dom.addEventListener('mouseup', handleMouseUp);

      // Scroll sync: editor -> preview
      const handleEditorScroll = () => {
        if (!syncScroll) return;
        const preview = document.querySelector('.preview-content') as HTMLElement;
        if (!preview) return;
        
        const scroller = view.scrollDOM;
        const scrollPercentage = scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight);
        if (isFinite(scrollPercentage)) {
          preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight);
        }
      };
      
      view.scrollDOM.addEventListener('scroll', handleEditorScroll);

      return () => {
        view.dom.removeEventListener('mouseup', handleMouseUp);
        view.scrollDOM.removeEventListener('scroll', handleEditorScroll);
        view.destroy();
        viewRef.current = null;
      };
    }, [isDark, syncScroll]); // Recreate on theme or syncScroll change

    // Update content when value changes externally
    useEffect(() => {
      if (!viewRef.current) return;
      const currentValue = viewRef.current.state.doc.toString();
      if (value !== currentValue) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: value,
          },
        });
      }
    }, [value]);

    // Update font size on zoom
    useEffect(() => {
      if (!viewRef.current) return;
      const content = viewRef.current.contentDOM;
      content.style.fontSize = `${14 * zoom}px`;
    }, [zoom]);

    return (
      <div className="editor-panel" ref={containerRef}>
        <div className="panel-header">
          <span className="panel-header-icon">📝</span>
          <span>Editor</span>
          <span className="panel-header-info">{lineCount} lines</span>
          <div className="panel-header-zoom">
            <button 
              className="zoom-btn" 
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              title="Zoom out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button 
              className="zoom-btn" 
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              title="Zoom in"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="editor-wrapper codemirror-wrapper">
          <div ref={editorRef} className="codemirror-container" />
        </div>
        
        {/* Selection Toolbar */}
        {selectionToolbar && (
          <div
            ref={toolbarRef}
            className="selection-toolbar"
            style={{
              position: 'fixed',
              left: selectionToolbar.x,
              top: selectionToolbar.y,
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              className="selection-toolbar-btn"
              onClick={() => handleFormat('bold')}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              className="selection-toolbar-btn"
              onClick={() => handleFormat('italic')}
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              className="selection-toolbar-btn"
              onClick={() => handleFormat('code')}
              title="Code"
            >
              {'<>'}
            </button>
            {onEnhanceSelection && (
              <>
                <div className="selection-toolbar-divider" />
                <button
                  className="selection-toolbar-btn enhance"
                  onClick={() => {
                    onEnhanceSelection(selectionToolbar.text);
                    setSelectionToolbar(null);
                  }}
                  title="Enhance with AI"
                >
                  ✨ Enhance
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

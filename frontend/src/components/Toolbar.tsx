import { useState, useRef, useEffect } from 'react';

interface ToolbarProps {
  onFormat: (type: string) => void;
  onEnhanceSelection: () => void;
  onEnhanceDocument: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onInsertLink: () => void;
  onInsertImage: () => void;
  onExport: () => void;
  onExportPDF: () => void;
  onCopy: () => void;
  onClear: () => void;
  onToggleSyncScroll: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
  syncScroll: boolean;
  theme: 'dark' | 'light';
  hasSelection: boolean;
  hasApiKey: boolean;
  activeStyles: Set<string>;
}

export function Toolbar({
  onFormat,
  onEnhanceSelection,
  onEnhanceDocument,
  onUndo,
  onRedo,
  onInsertLink,
  onInsertImage,
  onExport,
  onExportPDF,
  onCopy,
  onClear,
  onToggleSyncScroll,
  onToggleTheme,
  onOpenSettings,
  canUndo,
  canRedo,
  isLoading,
  syncScroll,
  theme,
  hasSelection,
  hasApiKey,
  activeStyles,
}: ToolbarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="toolbar">
      {/* Row 1: Formatting tools */}
      <div className="toolbar-row">
        {/* Undo/Redo Group */}
        <div className="toolbar-group">
          <ToolbarButton
            icon={<UndoIcon />}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          />
          <ToolbarButton
            icon={<RedoIcon />}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          />
        </div>

        <div className="toolbar-divider" />

        {/* Text Formatting Group */}
        <div className="toolbar-group">
          <ToolbarButton
            label="B"
            onClick={() => onFormat('bold')}
            title={activeStyles.has('bold') ? "Remove Bold (Ctrl+B)" : "Bold (Ctrl+B)"}
            className="bold"
            active={activeStyles.has('bold')}
          />
          <ToolbarButton
            label="I"
            onClick={() => onFormat('italic')}
            title={activeStyles.has('italic') ? "Remove Italic (Ctrl+I)" : "Italic (Ctrl+I)"}
            className="italic"
            active={activeStyles.has('italic')}
          />
          <ToolbarButton
            icon={<StrikethroughIcon />}
            onClick={() => onFormat('strikethrough')}
            title={activeStyles.has('strikethrough') ? "Remove Strikethrough" : "Strikethrough"}
            active={activeStyles.has('strikethrough')}
          />
          <ToolbarButton
            label="<>"
            onClick={() => onFormat('code')}
            title={activeStyles.has('code') ? "Remove Inline Code" : "Inline Code"}
            active={activeStyles.has('code')}
          />
          <ToolbarButton
            icon={<SubscriptIcon />}
            onClick={() => onFormat('subscript')}
            title={activeStyles.has('subscript') ? "Remove Subscript" : "Subscript (HTML)"}
            active={activeStyles.has('subscript')}
          />
          <ToolbarButton
            icon={<SuperscriptIcon />}
            onClick={() => onFormat('superscript')}
            title={activeStyles.has('superscript') ? "Remove Superscript" : "Superscript (HTML)"}
            active={activeStyles.has('superscript')}
          />
          <ToolbarButton
            icon={<HighlightIcon />}
            onClick={() => onFormat('highlight')}
            title={activeStyles.has('highlight') ? "Remove Highlight" : "Highlight/Mark (HTML)"}
            active={activeStyles.has('highlight')}
          />
          <ToolbarButton
            icon={<ClearFormattingIcon />}
            onClick={() => onFormat('clearFormatting')}
            title="Clear All Formatting"
          />
        </div>

        {/* Headings & Paragraph Group */}
        <div className="toolbar-group">
          <ToolbarButton
            label="P"
            onClick={() => onFormat('paragraph')}
            title={activeStyles.has('paragraph') ? "Already Paragraph" : "Paragraph (remove heading)"}
            active={activeStyles.has('paragraph')}
          />
          <ToolbarButton
            label="H1"
            onClick={() => onFormat('h1')}
            title={activeStyles.has('h1') ? "Change Heading 1 (Ctrl+1)" : "Heading 1 (Ctrl+1)"}
            active={activeStyles.has('h1')}
          />
          <ToolbarButton
            label="H2"
            onClick={() => onFormat('h2')}
            title={activeStyles.has('h2') ? "Change Heading 2 (Ctrl+2)" : "Heading 2 (Ctrl+2)"}
            active={activeStyles.has('h2')}
          />
          <ToolbarButton
            label="H3"
            onClick={() => onFormat('h3')}
            title={activeStyles.has('h3') ? "Change Heading 3 (Ctrl+3)" : "Heading 3 (Ctrl+3)"}
            active={activeStyles.has('h3')}
          />
          <ToolbarButton
            label="H4"
            onClick={() => onFormat('h4')}
            title={activeStyles.has('h4') ? "Change Heading 4" : "Heading 4"}
            active={activeStyles.has('h4')}
            className="small-label"
          />
          <ToolbarButton
            label="H5"
            onClick={() => onFormat('h5')}
            title={activeStyles.has('h5') ? "Change Heading 5" : "Heading 5"}
            active={activeStyles.has('h5')}
            className="small-label"
          />
          <ToolbarButton
            label="H6"
            onClick={() => onFormat('h6')}
            title={activeStyles.has('h6') ? "Change Heading 6" : "Heading 6"}
            active={activeStyles.has('h6')}
            className="small-label"
          />
        </div>

        {/* Lists & Blocks Group */}
        <div className="toolbar-group">
          <ToolbarButton
            icon={<ListIcon />}
            onClick={() => onFormat('list')}
            title={activeStyles.has('list') ? "Remove Bullet List" : "Bullet List"}
            active={activeStyles.has('list')}
          />
          <ToolbarButton
            icon={<OrderedListIcon />}
            onClick={() => onFormat('orderedList')}
            title={activeStyles.has('orderedList') ? "Remove Numbered List" : "Numbered List"}
            active={activeStyles.has('orderedList')}
          />
          <ToolbarButton
            icon={<TaskIcon />}
            onClick={() => onFormat('task')}
            title={activeStyles.has('task') ? "Remove Task List" : "Task List"}
            active={activeStyles.has('task')}
          />
          <ToolbarButton
            icon={<QuoteIcon />}
            onClick={() => onFormat('quote')}
            title={activeStyles.has('quote') ? "Remove Quote" : "Quote"}
            active={activeStyles.has('quote')}
          />
        </div>

        {/* Insert Group */}
        <div className="toolbar-group">
          <ToolbarButton
            icon={<LinkIcon />}
            onClick={onInsertLink}
            title="Insert Link (Ctrl+K)"
          />
          <ToolbarButton
            icon={<ImageIcon />}
            onClick={onInsertImage}
            title="Insert Image"
          />
          <ToolbarButton
            icon={<TableIcon />}
            onClick={() => onFormat('table')}
            title="Insert Table"
          />
          <ToolbarButton
            icon={<CodeBlockIcon />}
            onClick={() => onFormat('codeBlock')}
            title="Code Block"
          />
          <ToolbarButton
            icon={<HrIcon />}
            onClick={() => onFormat('hr')}
            title="Horizontal Rule"
          />
          <ToolbarButton
            icon={<FootnoteIcon />}
            onClick={() => onFormat('footnote')}
            title="Insert Footnote"
          />
        </div>

        <div className="toolbar-divider" />

        {/* More Options Menu */}
        <div className="toolbar-menu-wrapper" ref={menuRef}>
          <ToolbarButton
            icon={<MoreIcon />}
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            title="More Options"
            active={showMoreMenu}
          />
          {showMoreMenu && (
            <div className="toolbar-menu">
              <button className="toolbar-menu-item" onClick={() => { onCopy(); setShowMoreMenu(false); }}>
                <CopyIcon /> Copy Markdown
              </button>
              <div className="toolbar-menu-divider" />
              <button className="toolbar-menu-item" onClick={() => { onExport(); setShowMoreMenu(false); }}>
                <DownloadIcon /> Export as .md
              </button>
              <button className="toolbar-menu-item" onClick={() => { onExportPDF(); setShowMoreMenu(false); }}>
                <PdfIcon /> Export as PDF
              </button>
              <div className="toolbar-menu-divider" />
              <button
                className={`toolbar-menu-item ${syncScroll ? 'active' : ''}`}
                onClick={() => { onToggleSyncScroll(); setShowMoreMenu(false); }}
              >
                <SyncIcon /> Sync Scroll {syncScroll && '✓'}
              </button>
              <div className="toolbar-menu-divider" />
              <button className="toolbar-menu-item danger" onClick={() => { onClear(); setShowMoreMenu(false); }}>
                <TrashIcon /> Clear Content
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: AI tools and theme */}
      <div className="toolbar-row toolbar-row-ai">
        {/* Theme Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Enhance Document Button */}
        <button
          className={`enhance-btn enhance-btn-doc ${!hasApiKey ? 'disabled-no-key' : ''}`}
          onClick={onEnhanceDocument}
          disabled={isLoading || !hasApiKey}
          title={hasApiKey ? 'Enhance entire document with AI' : 'Add API key in settings to enable AI'}
        >
          <SparklesIcon />
          <span>AI Enhance Document</span>
        </button>

        {/* AI Enhancement Button - Dynamic based on selection */}
        <button
          className={`enhance-btn ${!hasSelection && !isLoading ? 'enhance-btn-disabled' : ''} ${!hasApiKey ? 'disabled-no-key' : ''}`}
          onClick={onEnhanceSelection}
          disabled={isLoading || !hasSelection || !hasApiKey}
          title={!hasApiKey ? 'Add API key in settings to enable AI' : undefined}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              <span>Enhancing...</span>
            </>
          ) : hasSelection ? (
            <>
              <SparklesIcon />
              <span>AI Enhance Selection</span>
            </>
          ) : (
            <>
              <SparklesIcon />
              <span>Select text to enhance</span>
            </>
          )}
        </button>

        {/* Settings Button */}
        <button
          className="settings-btn"
          onClick={onOpenSettings}
          title="Settings"
        >
          <GearIcon />
          {!hasApiKey && <span className="settings-btn-warning">!</span>}
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/JohnDimou/MarkdownEditorAI"
          target="_blank"
          rel="noopener noreferrer"
          className="github-btn"
          title="View on GitHub"
        >
          <GitHubIcon />
        </a>
      </div>
    </div>
  );
}

// Toolbar Button Component
interface ToolbarButtonProps {
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  className?: string;
  active?: boolean;
}

function ToolbarButton({ label, icon, onClick, disabled, title, className = '', active }: ToolbarButtonProps) {
  return (
    <button
      className={`toolbar-btn ${className} ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon || label}
    </button>
  );
}

// SVG Icons
function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  );
}

function StrikethroughIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <path d="M14 12a4 4 0 0 1 0 8H6" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  );
}

function TaskIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="6" height="6" rx="1" />
      <path d="m3 17 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function CodeBlockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function HrIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function FootnoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V4" />
      <path d="M5 12h14" />
      <circle cx="18" cy="5" r="2" />
    </svg>
  );
}

function SubscriptIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 5 8 8" />
      <path d="m12 5-8 8" />
      <path d="M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07" />
    </svg>
  );
}

function SuperscriptIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 19 8-8" />
      <path d="m12 19-8-8" />
      <path d="M20 12h-4c0-1.5.442-2 1.5-2.5S20 8.334 20 7c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06" />
    </svg>
  );
}

function HighlightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 11-6 6v3h9l3-3" />
      <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
    </svg>
  );
}

function ClearFormattingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
      <path d="m3 3 18 18" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15v-2h2a1 1 0 0 1 1 1v0a1 1 0 0 1-1 1H9z" />
      <path d="M9 15v2" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
      <path d="M5 3v4" />
      <path d="M3 5h4" />
      <path d="M19 17v4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

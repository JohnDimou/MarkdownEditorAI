import { useState, useEffect, useRef } from 'react';

type DialogType = 'link' | 'image';

interface InsertDialogProps {
  type: DialogType;
  onInsert: (text: string, url: string) => void;
  onClose: () => void;
  selectedText?: string;
}

// Extract a nice display name from a URL
function getDisplayTextFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Get hostname without www
    let host = parsed.hostname.replace(/^www\./, '');
    // Capitalize first letter of each part
    host = host.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('.');
    return host;
  } catch {
    // If URL parsing fails, just clean it up
    return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

export function InsertDialog({ type, onInsert, onClose, selectedText = '' }: InsertDialogProps) {
  const [text, setText] = useState(selectedText);
  const [url, setUrl] = useState('');
  const [autoText, setAutoText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Auto-generate display text when URL changes
  useEffect(() => {
    if (url.trim() && !text.trim()) {
      setAutoText(getDisplayTextFromUrl(url));
    } else {
      setAutoText('');
    }
  }, [url, text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      // Use user text, or auto-generated text, or URL as fallback
      const displayText = text.trim() || autoText || url;
      onInsert(displayText, url);
    }
  };

  const isLink = type === 'link';

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3 className="dialog-title">
            {isLink ? '🔗 Insert Link' : '🖼️ Insert Image'}
          </h3>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="dialog-field">
            <label htmlFor="text">
              {isLink ? 'Link Text' : 'Alt Text'}
              {isLink && autoText && <span style={{ opacity: 0.6, fontWeight: 400 }}> (auto: {autoText})</span>}
            </label>
            <input
              ref={inputRef}
              id="text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={autoText || (isLink ? 'Display text...' : 'Image description...')}
              autoComplete="off"
            />
          </div>
          <div className="dialog-field">
            <label htmlFor="url">{isLink ? 'URL' : 'Image URL'}</label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={isLink ? 'https://example.com' : 'https://example.com/image.jpg'}
              required
              autoComplete="off"
            />
          </div>
          <div className="dialog-preview">
            <span className="dialog-preview-label">Preview:</span>
            <code className="dialog-preview-code">
              {isLink
                ? `[${text || autoText || 'text'}](${url || 'url'})`
                : `![${text || 'alt'}](${url || 'url'})`}
            </code>
          </div>
          <div className="dialog-actions">
            <button type="button" className="dialog-btn dialog-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="dialog-btn dialog-btn-primary" disabled={!url.trim()}>
              Insert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


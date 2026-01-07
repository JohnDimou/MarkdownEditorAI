import { useState, useEffect, useRef } from 'react';

type DialogType = 'link' | 'image';

interface InsertDialogProps {
  type: DialogType;
  onInsert: (text: string, url: string) => void;
  onClose: () => void;
  selectedText?: string;
}

export function InsertDialog({ type, onInsert, onClose, selectedText = '' }: InsertDialogProps) {
  const [text, setText] = useState(selectedText);
  const [url, setUrl] = useState('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onInsert(text || url, url);
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
            <label htmlFor="text">{isLink ? 'Link Text' : 'Alt Text'}</label>
            <input
              ref={inputRef}
              id="text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isLink ? 'Display text...' : 'Image description...'}
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
                ? `[${text || 'text'}](${url || 'url'})`
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


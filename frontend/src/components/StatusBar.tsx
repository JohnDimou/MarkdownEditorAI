import { useMemo } from 'react';

interface StatusBarProps {
  content: string;
  lastSaved: Date | null;
  isSaving: boolean;
}

export function StatusBar({ content, lastSaved, isSaving }: StatusBarProps) {
  const stats = useMemo(() => {
    const text = content.trim();
    if (!text) {
      return { words: 0, characters: 0, lines: 0, readingTime: 0 };
    }

    const words = text.split(/\s+/).filter(Boolean).length;
    const characters = text.length;
    const lines = content.split('\n').length;
    const readingTime = Math.max(1, Math.ceil(words / 200)); // avg 200 wpm

    return { words, characters, lines, readingTime };
  }, [content]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-item status-tip">
          <span className="status-icon">💡</span>
          Select text to enhance with AI
        </span>
        <span className="status-divider">•</span>
        <span className="status-item">
          <span className="status-icon">📝</span>
          {stats.words} words
        </span>
        <span className="status-divider">•</span>
        <span className="status-item">
          {stats.characters} chars
        </span>
        <span className="status-divider">•</span>
        <span className="status-item">
          {stats.lines} lines
        </span>
        <span className="status-divider">•</span>
        <span className="status-item">
          <span className="status-icon">⏱</span>
          {stats.readingTime} min read
        </span>
      </div>
      <div className="status-bar-right">
        {isSaving ? (
          <span className="status-item status-saving">
            <span className="saving-indicator" />
            Saving...
          </span>
        ) : lastSaved ? (
          <span className="status-item status-saved">
            <span className="status-icon">✓</span>
            Saved at {formatTime(lastSaved)}
          </span>
        ) : (
          <span className="status-item">
            <span className="status-icon">💾</span>
            Not saved
          </span>
        )}
      </div>
    </div>
  );
}


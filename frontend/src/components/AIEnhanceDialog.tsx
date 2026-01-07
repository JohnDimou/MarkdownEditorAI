import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface Change {
  id: string;
  original: string;
  replacement: string;
  reason: string;
}

interface AISettings {
  apiKey: string;
  model: string;
  reasoningEffort: 'low' | 'medium' | 'high';
  maxTokens: number;
}

interface AIEnhanceDialogProps {
  readonly originalText: string;
  readonly mode: 'selection' | 'document';
  readonly onApply: (newText: string) => void;
  readonly onClose: () => void;
  readonly aiSettings: AISettings;
}

const LOADING_MESSAGES_SELECTION = [
  { emoji: '👀', text: 'Hmm, interesting...', subtext: 'Scanning your words' },
  { emoji: '🧠', text: 'Big brain mode activated', subtext: 'Processing genius' },
  { emoji: '💡', text: 'Got some ideas!', subtext: 'Creativity flowing' },
  { emoji: '✍️', text: 'Writing magic...', subtext: 'Words assembling' },
  { emoji: '✨', text: 'Sprinkling perfection', subtext: 'Almost gorgeous' },
  { emoji: '🎯', text: 'Nailing it!', subtext: 'Precision mode' },
  { emoji: '🔥', text: 'This is gonna be good', subtext: 'Trust the process' },
  { emoji: '🚀', text: 'Ready for launch!', subtext: '3... 2... 1...' },
];

const LOADING_MESSAGES_DOCUMENT = [
  { emoji: '📖', text: 'Speed reading...', subtext: 'Absorbing knowledge' },
  { emoji: '🔍', text: 'Detective mode on', subtext: 'Finding hidden gems' },
  { emoji: '🧠', text: 'Processing everything', subtext: 'Neurons firing' },
  { emoji: '💭', text: 'Imagining possibilities', subtext: 'Dreams loading' },
  { emoji: '🎨', text: 'Painting with words', subtext: 'Artistry in progress' },
  { emoji: '⚡', text: 'Supercharging prose', subtext: 'Power level rising' },
  { emoji: '✨', text: 'Adding that sparkle', subtext: 'Glitter everywhere' },
  { emoji: '🌟', text: 'Making it shine', subtext: 'Brilliance incoming' },
  { emoji: '🔥', text: 'Too hot to handle', subtext: 'Fire content alert' },
  { emoji: '🚀', text: 'Launching masterpiece', subtext: 'Countdown started' },
];

const SELECTION_PROMPTS = [
  { label: '✨ Improve', prompt: 'Improve clarity and flow' },
  { label: '📝 Grammar', prompt: 'Fix grammar and spelling' },
  { label: '✂️ Shorten', prompt: 'Make it more concise' },
  { label: '📖 Expand', prompt: 'Expand with more detail' },
  { label: '🎯 Professional', prompt: 'Make it more professional' },
  { label: '💬 Casual', prompt: 'Make it more casual' },
];

const DOCUMENT_PROMPTS = [
  { label: '✨ Improve All', prompt: 'Improve clarity and readability' },
  { label: '📝 Fix Grammar', prompt: 'Fix all grammar and spelling' },
  { label: '🎯 Professional', prompt: 'Make more professional' },
  { label: '✂️ Condense', prompt: 'Make everything more concise' },
  { label: '🔧 Structure', prompt: 'Improve markdown structure' },
  { label: '📖 Expand', prompt: 'Add more detail throughout' },
];

export function AIEnhanceDialog({
  originalText,
  mode,
  onApply,
  onClose,
  aiSettings,
}: AIEnhanceDialogProps) {
  const [changes, setChanges] = useState<Change[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [hasSubmittedPrompt, setHasSubmittedPrompt] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = mode === 'document' ? LOADING_MESSAGES_DOCUMENT : LOADING_MESSAGES_SELECTION;

  // Cycle through loading messages - slower for document, faster for selection
  useEffect(() => {
    if (!isLoading) {
      setLoadingMessageIndex(0);
      return;
    }
    
    // Document mode: 2s per message, Selection mode: 600ms
    const speed = mode === 'document' ? 2000 : 600;
    
    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, speed);
    
    return () => clearInterval(interval);
  }, [isLoading, loadingMessages.length, mode]);

  const prompts = mode === 'document' ? DOCUMENT_PROMPTS : SELECTION_PROMPTS;

  // Select all changes by default when they arrive
  useEffect(() => {
    if (changes.length > 0) {
      setSelectedChanges(new Set(changes.map(c => c.id)));
    }
  }, [changes]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fetchChanges = useCallback(async (instruction?: string) => {
    setIsLoading(true);
    setError(null);
    setChanges([]);

    try {
      const response = await fetch('/api/enhance-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          mode,
          customInstruction: instruction || '',
          settings: {
            apiKey: aiSettings.apiKey,
            model: aiSettings.model,
            reasoningEffort: aiSettings.reasoningEffort,
            maxTokens: aiSettings.maxTokens,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      if (data.changes && data.changes.length > 0) {
        setChanges(data.changes);
      } else {
        setError('No improvements found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [originalText, mode, aiSettings]);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmittedPrompt(true);
    fetchChanges(customPrompt.trim() || undefined);
  };

  const handleQuickPrompt = (prompt: string) => {
    setCustomPrompt(prompt);
    setHasSubmittedPrompt(true);
    fetchChanges(prompt);
  };

  const toggleChange = (id: string) => {
    setSelectedChanges(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApply = () => {
    if (changes.length === 0) return;

    // Apply selected changes to the original text
    let result = originalText;
    
    // Sort changes by position in reverse order so we don't mess up indices
    const selectedChangesList = changes
      .filter(c => selectedChanges.has(c.id))
      .sort((a, b) => {
        const posA = originalText.indexOf(a.original);
        const posB = originalText.indexOf(b.original);
        return posB - posA; // Reverse order
      });

    for (const change of selectedChangesList) {
      result = result.replace(change.original, change.replacement);
    }

    onApply(result);
    onClose();
  };

  // Build preview with changes visualized inline
  const previewSegments = useMemo(() => {
    if (changes.length === 0) return [];

    // For selection mode with one change, return simple comparison
    if (mode === 'selection' && changes.length === 1) {
      return [{
        type: 'full' as const,
        original: originalText,
        replacement: changes[0].replacement,
        changeId: changes[0].id,
        reason: changes[0].reason,
      }];
    }

    // For document mode, build inline preview
    const segments: Array<{
      type: 'unchanged' | 'change';
      text?: string;
      original?: string;
      replacement?: string;
      changeId?: string;
      reason?: string;
    }> = [];

    let currentPos = 0;
    const sortedChanges = [...changes].sort((a, b) => {
      const posA = originalText.indexOf(a.original);
      const posB = originalText.indexOf(b.original);
      return posA - posB;
    });

    for (const change of sortedChanges) {
      const changePos = originalText.indexOf(change.original, currentPos);
      if (changePos === -1) continue;

      // Add unchanged text before this change
      if (changePos > currentPos) {
        segments.push({
          type: 'unchanged',
          text: originalText.slice(currentPos, changePos),
        });
      }

      // Add the change
      segments.push({
        type: 'change',
        original: change.original,
        replacement: change.replacement,
        changeId: change.id,
        reason: change.reason,
      });

      currentPos = changePos + change.original.length;
    }

    // Add remaining unchanged text
    if (currentPos < originalText.length) {
      segments.push({
        type: 'unchanged',
        text: originalText.slice(currentPos),
      });
    }

    return segments;
  }, [changes, originalText, mode]);

  const stats = useMemo(() => ({
    lines: originalText.split('\n').length,
    words: originalText.split(/\s+/).filter(Boolean).length,
    chars: originalText.length,
  }), [originalText]);

  return (
    <div className="ai-enhance-overlay" onClick={onClose}>
      <div
        ref={popupRef}
        className={`ai-enhance-dialog ${mode}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ai-enhance-header">
          <div className="ai-enhance-title-row">
            <div className="ai-enhance-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            </div>
            <div className="ai-enhance-title">
              <span className="ai-enhance-title-text">
                {mode === 'document' ? 'Enhance Document' : 'Enhance Selection'}
              </span>
              <span className="ai-enhance-subtitle">AI-powered improvements</span>
            </div>
          </div>
          <button className="ai-enhance-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Initial Setup */}
        {!hasSubmittedPrompt && !isLoading && (
          <div className="ai-enhance-setup">
            {mode === 'document' && (
              <div className="ai-enhance-stats">
                <div className="ai-enhance-stat">
                  <span className="stat-value">{stats.lines}</span>
                  <span className="stat-label">Lines</span>
                </div>
                <div className="ai-enhance-stat">
                  <span className="stat-value">{stats.words}</span>
                  <span className="stat-label">Words</span>
                </div>
                <div className="ai-enhance-stat">
                  <span className="stat-value">{stats.chars}</span>
                  <span className="stat-label">Characters</span>
                </div>
              </div>
            )}

            {mode === 'selection' && (
              <div className="ai-enhance-preview-text">
                <span className="preview-label">Selected text</span>
                <div className="preview-content">{originalText}</div>
              </div>
            )}

            <form onSubmit={handlePromptSubmit} className="ai-enhance-form">
              <div className="ai-enhance-input-wrapper">
                <svg className="ai-enhance-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={mode === 'document' ? 'How should I enhance the document?' : 'How should I improve this?'}
                  autoComplete="off"
                />
                <button type="submit" className="ai-enhance-submit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </form>

            <div className="ai-enhance-prompts">
              <span className="prompts-label">Quick actions</span>
              <div className="prompts-grid">
                {prompts.map((item) => (
                  <button
                    key={item.prompt}
                    className="prompt-btn"
                    onClick={() => handleQuickPrompt(item.prompt)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="ai-enhance-loading">
            <div className="ai-loading-emoji-container">
              <span className="ai-loading-emoji" key={loadingMessageIndex}>
                {loadingMessages[loadingMessageIndex].emoji}
              </span>
            </div>
            <div className="ai-loading-progress">
              {loadingMessages.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`ai-loading-progress-dot ${idx === loadingMessageIndex ? 'active' : ''} ${idx < loadingMessageIndex ? 'done' : ''}`}
                />
              ))}
            </div>
            <span className="ai-loading-text" key={`text-${loadingMessageIndex}`}>
              {loadingMessages[loadingMessageIndex].text}
            </span>
            <span className="ai-loading-subtext" key={`sub-${loadingMessageIndex}`}>
              {loadingMessages[loadingMessageIndex].subtext}
            </span>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="ai-enhance-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => fetchChanges(customPrompt.trim() || undefined)}>
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {hasSubmittedPrompt && !isLoading && !error && changes.length > 0 && (
          <div className="ai-enhance-results">
            {/* Change count badge */}
            <div className="ai-enhance-results-header">
              <div className="changes-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{changes.length} improvement{changes.length !== 1 ? 's' : ''} found</span>
              </div>
              <span className="changes-hint">
                {mode === 'document' ? 'Click changes to toggle' : ''}
              </span>
            </div>

            {/* Preview area */}
            <div className="ai-enhance-preview">
              {mode === 'selection' && previewSegments.length === 1 && previewSegments[0].type === 'full' && (
                <div className="ai-selection-comparison">
                  <div className="comparison-panel original">
                    <div className="panel-header">
                      <span className="panel-badge original">Original</span>
                    </div>
                    <div className="panel-content">{previewSegments[0].original}</div>
                  </div>
                  <div className="comparison-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                  <div className="comparison-panel enhanced">
                    <div className="panel-header">
                      <span className="panel-badge enhanced">Enhanced</span>
                    </div>
                    <div className="panel-content">{previewSegments[0].replacement}</div>
                  </div>
                </div>
              )}

              {mode === 'document' && (
                <div className="ai-document-preview">
                  {previewSegments.map((segment, idx) => (
                    segment.type === 'unchanged' ? (
                      <span key={idx} className="preview-unchanged">{segment.text}</span>
                    ) : (
                      <span
                        key={idx}
                        className={`preview-change ${selectedChanges.has(segment.changeId!) ? 'selected' : 'deselected'}`}
                        onClick={() => toggleChange(segment.changeId!)}
                        title={segment.reason}
                      >
                        <span className="change-original">{segment.original}</span>
                        <span className="change-arrow">→</span>
                        <span className="change-replacement">{segment.replacement}</span>
                      </span>
                    )
                  ))}
                </div>
              )}
            </div>

            {/* Change reasons for selection mode */}
            {mode === 'selection' && changes[0]?.reason && (
              <div className="ai-enhance-reason">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                <span>{changes[0].reason}</span>
              </div>
            )}

            {/* Actions */}
            <div className="ai-enhance-actions">
              <button
                className="ai-action-btn secondary"
                onClick={() => {
                  setHasSubmittedPrompt(false);
                  setChanges([]);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back
              </button>
              <button
                className="ai-action-btn secondary"
                onClick={() => fetchChanges(customPrompt.trim() || undefined)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Regenerate
              </button>
              <button
                className="ai-action-btn primary"
                onClick={handleApply}
                disabled={selectedChanges.size === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Apply {selectedChanges.size > 1 ? `${selectedChanges.size} Changes` : 'Change'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="ai-enhance-footer">
          <kbd>Enter</kbd> to enhance • <kbd>Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}


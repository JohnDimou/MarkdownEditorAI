import { useState, useEffect, useRef, useCallback } from 'react';

export interface AISettings {
  apiKey: string;
  model: string;
  reasoningEffort: 'low' | 'medium' | 'high';
  maxTokens: number;
}

interface SettingsDialogProps {
  settings: AISettings;
  onSave: (settings: AISettings) => void;
  onClose: () => void;
}

interface ModelInfo {
  id: string;
  name: string;
  hasReasoning: boolean;
  reasoningOptions?: string[];
  defaultReasoning?: string;
}

const ALL_REASONING_OPTIONS = [
  { value: 'low', label: 'Low', description: 'Faster responses' },
  { value: 'medium', label: 'Medium', description: 'Balanced' },
  { value: 'high', label: 'High', description: 'More thorough' },
];

export const DEFAULT_SETTINGS: AISettings = {
  apiKey: '',
  model: 'gpt-4o',
  reasoningEffort: 'low',
  maxTokens: 16000,
};

export function SettingsDialog({ settings, onSave, onClose }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<AISettings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'model' | 'api'>(settings.apiKey ? 'model' : 'api');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fetchedForKeyRef = useRef<string | null>(null);

  const selectedModel = availableModels.find(m => m.id === localSettings.model);
  const supportsReasoning = selectedModel?.hasReasoning ?? false;

  // Fetch models from OpenAI API
  const fetchModels = useCallback(async (apiKey: string) => {
    if (!apiKey || apiKey.length < 20) {
      setAvailableModels([]);
      return;
    }
    if (fetchedForKeyRef.current === apiKey) return;
    
    setIsLoadingModels(true);
    setModelError(null);
    
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch models');
      }
      
      if (data.models && data.models.length > 0) {
        setAvailableModels(data.models);
        fetchedForKeyRef.current = apiKey;
        
        // If current model not in list, select first available
        if (!data.models.some((m: ModelInfo) => m.id === localSettings.model)) {
          setLocalSettings(prev => ({ ...prev, model: data.models[0].id }));
        }
      }
    } catch (err) {
      setModelError(err instanceof Error ? err.message : 'Failed to fetch models');
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [localSettings.model]);

  // Fetch models when API key changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchModels(localSettings.apiKey);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [localSettings.apiKey, fetchModels]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleClearApiKey = () => {
    setLocalSettings(prev => ({ ...prev, apiKey: '' }));
  };

  const handleResetDefaults = () => {
    setLocalSettings(prev => ({
      ...DEFAULT_SETTINGS,
      apiKey: prev.apiKey, // Keep the API key
    }));
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div 
        ref={dialogRef}
        className="dialog settings-dialog" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 className="dialog-title">
            <span className="settings-icon">⚙️</span>
            Settings
          </h3>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'model' ? 'active' : ''}`}
            onClick={() => setActiveTab('model')}
          >
            🤖 Model
          </button>
          <button 
            className={`settings-tab ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            🔑 API Key
            {!localSettings.apiKey && <span className="tab-warning">!</span>}
          </button>
        </div>

        <div className="settings-content">
          {/* Model Tab */}
          {activeTab === 'model' && (
            <div className="settings-section">
              <div className="settings-field">
                <label className="settings-label">AI Model</label>
                {modelError && (
                  <div className="model-error">
                    <span>⚠️ {modelError}</span>
                    <button onClick={() => fetchModels(localSettings.apiKey)}>Retry</button>
                  </div>
                )}
                {!localSettings.apiKey && availableModels.length === 0 && !isLoadingModels && (
                  <div className="model-empty-state">
                    <span className="model-empty-icon">🔑</span>
                    <span className="model-empty-text">Add your API key first</span>
                    <button 
                      className="model-empty-btn"
                      onClick={() => setActiveTab('api')}
                    >
                      Go to API Key →
                    </button>
                  </div>
                )}
                {isLoadingModels && (
                  <div className="model-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="model-option model-skeleton">
                        <div className="skeleton-line skeleton-name" />
                        <div className="skeleton-line skeleton-id" />
                      </div>
                    ))}
                  </div>
                )}
                {!isLoadingModels && availableModels.length > 0 && (
                  <div className="model-grid">
                    {availableModels.map(model => (
                      <button
                        key={model.id}
                        className={`model-option ${localSettings.model === model.id ? 'selected' : ''}`}
                        onClick={() => {
                          // Auto-select valid reasoning effort for new model
                          const newReasoning = model.reasoningOptions?.includes(localSettings.reasoningEffort)
                            ? localSettings.reasoningEffort
                            : (model.defaultReasoning as AISettings['reasoningEffort']) || 'medium';
                          setLocalSettings(prev => ({ 
                            ...prev, 
                            model: model.id,
                            reasoningEffort: model.hasReasoning ? newReasoning : prev.reasoningEffort
                          }));
                        }}
                      >
                        <span className="model-name">{model.name}</span>
                        <span className="model-id">{model.id}</span>
                        {model.hasReasoning && <span className="model-badge">Reasoning</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {supportsReasoning && (
                <div className="settings-field">
                  <label className="settings-label">Reasoning Effort</label>
                  <p className="settings-hint">
                    {selectedModel?.reasoningOptions?.length === 1 
                      ? `This model only supports "${selectedModel.reasoningOptions[0]}" effort`
                      : 'Higher effort = more thorough but slower'}
                  </p>
                  <div className="reasoning-options">
                    {ALL_REASONING_OPTIONS
                      .filter(opt => !selectedModel?.reasoningOptions?.length || selectedModel.reasoningOptions.includes(opt.value))
                      .map(option => (
                      <button
                        key={option.value}
                        className={`reasoning-option ${localSettings.reasoningEffort === option.value ? 'selected' : ''}`}
                        onClick={() => setLocalSettings(prev => ({ 
                          ...prev, 
                          reasoningEffort: option.value as AISettings['reasoningEffort']
                        }))}
                      >
                        <span className="reasoning-label">{option.label}</span>
                        <span className="reasoning-desc">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="settings-field">
                <label className="settings-label">Max Tokens</label>
                <p className="settings-hint">Maximum response length ({localSettings.maxTokens.toLocaleString()} tokens)</p>
                <input
                  type="range"
                  min="1000"
                  max="64000"
                  step="1000"
                  value={localSettings.maxTokens}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    maxTokens: Number(e.target.value) 
                  }))}
                  className="settings-slider"
                />
                <div className="slider-labels">
                  <span>1K</span>
                  <span>32K</span>
                  <span>64K</span>
                </div>
              </div>

              <button className="settings-reset-btn" onClick={handleResetDefaults}>
                ↺ Reset to Defaults
              </button>
            </div>
          )}

          {/* API Key Tab */}
          {activeTab === 'api' && (
            <div className="settings-section">
              <div className="settings-field">
                <label className="settings-label">OpenAI API Key</label>
                <p className="settings-hint">
                  Get your key from{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                    platform.openai.com
                  </a>
                </p>
                <div className="api-key-input-wrapper">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={localSettings.apiKey}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="sk-..."
                    className="settings-input api-key-input"
                    autoComplete="off"
                  />
                  <button 
                    className="api-key-toggle"
                    onClick={() => setShowApiKey(!showApiKey)}
                    type="button"
                  >
                    {showApiKey ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {localSettings.apiKey && (
                <div className="api-key-status">
                  <span className="api-key-status-icon">✓</span>
                  <span>API key configured</span>
                  <button className="api-key-clear" onClick={handleClearApiKey}>
                    Remove
                  </button>
                </div>
              )}

              {!localSettings.apiKey && (
                <div className="api-key-warning">
                  <span className="warning-icon">⚠️</span>
                  <span>No API key set. AI features will be disabled.</span>
                </div>
              )}

              <div className="api-info-box">
                <h4>🔒 Your key is stored locally</h4>
                <p>Your API key is saved in your browser's local storage and sent directly to OpenAI. It never touches our servers.</p>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-actions">
          <button className="dialog-btn dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn dialog-btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}


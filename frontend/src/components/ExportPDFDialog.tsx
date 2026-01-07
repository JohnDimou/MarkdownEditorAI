import { useState } from 'react';

interface ExportPDFDialogProps {
  onExport: (options: { lightMode: boolean; grayscale: boolean; scale: number }) => void;
  onClose: () => void;
}

export function ExportPDFDialog({ onExport, onClose }: ExportPDFDialogProps) {
  const [lightMode, setLightMode] = useState(true);
  const [grayscale, setGrayscale] = useState(false);
  const [scale, setScale] = useState(100);

  const handleExport = () => {
    onExport({ lightMode, grayscale, scale });
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog export-pdf-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3 className="dialog-title">Export as PDF</h3>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        <div className="dialog-form">
          <div className="export-pdf-options">
            <label className="export-pdf-option">
              <input
                type="checkbox"
                checked={lightMode}
                onChange={(e) => setLightMode(e.target.checked)}
              />
              <span className="export-pdf-option-content">
                <span className="export-pdf-option-icon">☀️</span>
                <span className="export-pdf-option-text">
                  <strong>Light Mode</strong>
                  <small>White background for printing</small>
                </span>
              </span>
            </label>

            <label className="export-pdf-option">
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
              />
              <span className="export-pdf-option-content">
                <span className="export-pdf-option-icon">◐</span>
                <span className="export-pdf-option-text">
                  <strong>Remove Colors</strong>
                  <small>Black & white for text-only documents</small>
                </span>
              </span>
            </label>
          </div>

          {/* Scale Slider */}
          <div className="export-pdf-scale">
            <div className="export-pdf-scale-header">
              <span className="export-pdf-scale-label">Content Scale</span>
              <span className="export-pdf-scale-value">{scale}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              step="10"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="export-pdf-scale-slider"
            />
            <div className="export-pdf-scale-marks">
              <span>50%</span>
              <span>100%</span>
              <span>150%</span>
            </div>
          </div>

          {/* Live Preview */}
          <div className="export-pdf-preview">
            <span className="export-pdf-preview-label">Preview</span>
            <div className="export-pdf-preview-container">
              <div 
                className={`export-pdf-preview-page ${lightMode ? 'light' : 'dark'} ${grayscale ? 'grayscale' : ''}`}
                style={{ transform: `scale(${scale / 100})`, transformOrigin: 'top left' }}
              >
                <div className="preview-h1">Document Title</div>
                <div className="preview-text">
                  This is a <strong>powerful</strong> markdown editor with <em>live preview</em> and AI suggestions.
                </div>
                <div className="preview-h2">Features</div>
                <ul className="preview-list">
                  <li>Real-time preview</li>
                  <li>Dark/Light mode</li>
                  <li>AI enhancement</li>
                </ul>
                <div className="preview-code">const editor = "OV MarkDown AI";</div>
                <div className="preview-blockquote">
                  Export your documents with custom styling!
                </div>
              </div>
            </div>
          </div>

          <div className="dialog-actions">
            <button type="button" className="dialog-btn dialog-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="dialog-btn dialog-btn-primary" onClick={handleExport}>
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


import { useCallback, useRef, memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

// Custom sanitize schema to allow safe HTML elements and attributes
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'img', 'video', 'audio', 'source', 'iframe',
    'details', 'summary', 'mark', 'abbr', 'kbd', 'sub', 'sup',
    'u', 's', 'ins', 'del', 'small', 'big', 'center',
    'figure', 'figcaption', 'picture',
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': ['className', 'style', 'id', 'title', 'align'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'style'],
    video: ['src', 'controls', 'width', 'height', 'autoplay', 'muted', 'loop', 'poster'],
    audio: ['src', 'controls', 'autoplay', 'muted', 'loop'],
    source: ['src', 'type'],
    iframe: ['src', 'width', 'height', 'frameBorder', 'allowFullScreen'],
    a: ['href', 'target', 'rel', 'title'],
    abbr: ['title'],
  },
};

interface PreviewProps {
  content: string;
  syncScroll?: boolean;
}

export const Preview = memo(function Preview({ content, syncScroll }: PreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 10) / 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 10) / 10));
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll) return;
    
    const preview = e.currentTarget;
    const editorScroller = document.querySelector('.cm-scroller') as HTMLElement;
    if (!editorScroller) return;

    const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    const editorScrollTop = scrollPercentage * (editorScroller.scrollHeight - editorScroller.clientHeight);
    
    editorScroller.scrollTop = editorScrollTop;
  }, [syncScroll]);

  const ZoomControls = () => (
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
  );

  if (!content.trim()) {
    return (
      <div className="preview-panel">
        <div className="panel-header">
          <span className="panel-header-icon">👁️</span>
          <span>Preview</span>
          <ZoomControls />
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-text">
            Your rendered markdown will appear here
          </div>
          <div className="empty-state-hint">
            Start typing in the editor to see live preview
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-panel">
      <div className="panel-header">
        <span className="panel-header-icon">👁️</span>
        <span>Preview</span>
        <ZoomControls />
      </div>
      <div 
        className="preview-content" 
        ref={contentRef}
        onScroll={handleScroll}
        style={{ fontSize: `${16 * zoom}px` }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
          components={{
            code({ node, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const inline = !match && !className;
              
              if (inline) {
                return (
                  <code className="inline-code" {...props}>
                    {children}
                  </code>
                );
              }

              return (
                <div className="code-block-wrapper">
                  {match && (
                    <div className="code-block-header">
                      <span className="code-block-lang">{match[1]}</span>
                      <button 
                        className="code-block-copy"
                        onClick={() => {
                          navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                        }}
                        title="Copy code"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match?.[1] || 'text'}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      borderRadius: match ? '0 0 8px 8px' : '8px',
                      fontSize: '13px',
                    }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              );
            },
            a({ href, children }) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
            },
            table({ children }) {
              return (
                <div className="table-wrapper">
                  <table>{children}</table>
                </div>
              );
            },
            input({ checked, ...props }) {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="task-checkbox"
                  {...props}
                />
              );
            },
            img({ src, alt, width, height, style, ...props }) {
              // Parse style string to object if it exists
              const styleObj = typeof style === 'string' 
                ? style.split(';').reduce((acc, item) => {
                    const [key, value] = item.split(':').map(s => s?.trim());
                    if (key && value) {
                      // Convert kebab-case to camelCase
                      const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                      acc[camelKey] = value;
                    }
                    return acc;
                  }, {} as Record<string, string>)
                : style;
              
              return (
                <span className="image-wrapper">
                  <img 
                    src={src} 
                    alt={alt || ''} 
                    loading="lazy" 
                    width={width}
                    height={height}
                    style={styleObj}
                    {...props}
                  />
                  {alt && <span className="image-caption">{alt}</span>}
                </span>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

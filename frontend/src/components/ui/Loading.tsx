import React from 'react';
import './Loading.css';

interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'bars';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  text?: string;
  overlay?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  color,
  text,
  overlay = false,
  className = ''
}) => {
  const loadingColor = color || '#3b82f6';

  const containerClasses = [
    'loading',
    `loading--${variant}`,
    `loading--${size}`,
    overlay && 'loading--overlay',
    className
  ].filter(Boolean).join(' ');

  const renderSpinner = () => (
    <div className="loading-spinner">
      <svg viewBox="0 0 50 50" className="loading-spinner__svg">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={loadingColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="31.416"
          strokeDashoffset="31.416"
        />
      </svg>
    </div>
  );

  const renderDots = () => (
    <div className="loading-dots">
      {[1, 2, 3].map((dot) => (
        <div
          key={dot}
          className="loading-dots__dot"
          style={{ backgroundColor: loadingColor }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className="loading-pulse">
      <div
        className="loading-pulse__circle"
        style={{ backgroundColor: loadingColor }}
      />
    </div>
  );

  const renderSkeleton = () => (
    <div className="loading-skeleton">
      <div className="loading-skeleton__line loading-skeleton__line--title" />
      <div className="loading-skeleton__line loading-skeleton__line--text" />
      <div className="loading-skeleton__line loading-skeleton__line--text" />
      <div className="loading-skeleton__line loading-skeleton__line--short" />
    </div>
  );

  const renderBars = () => (
    <div className="loading-bars">
      {[1, 2, 3, 4, 5].map((bar) => (
        <div
          key={bar}
          className="loading-bars__bar"
          style={{ backgroundColor: loadingColor }}
        />
      ))}
    </div>
  );

  const renderLoadingContent = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      case 'bars':
        return renderBars();
      default:
        return renderSpinner();
    }
  };

  return (
    <div 
      className={containerClasses}
      role="status"
      aria-label={text || 'Carregando...'}
    >
      {overlay && <div className="loading-overlay" />}
      
      <div className="loading-content">
        {renderLoadingContent()}
        
        {text && (
          <div className="loading-text">
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

// Loading Skeleton Components
export const LoadingSkeleton: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`loading-skeleton ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={`loading-skeleton__line ${
            index === 0 ? 'loading-skeleton__line--title' :
            index === lines - 1 ? 'loading-skeleton__line--short' :
            'loading-skeleton__line--text'
          }`}
        />
      ))}
    </div>
  );
};

// Loading Button
export const LoadingButton: React.FC<{
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ loading = false, children, className = '', onClick, disabled }) => {
  return (
    <button
      className={`btn ${loading ? 'btn--loading' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <Loading variant="spinner" size="sm" className="btn__loading" />
      )}
      <span className={loading ? 'btn__text--loading' : ''}>
        {children}
      </span>
    </button>
  );
};

// Loading Overlay
export const LoadingOverlay: React.FC<{
  visible: boolean;
  text?: string;
  variant?: LoadingProps['variant'];
}> = ({ visible, text, variant = 'spinner' }) => {
  if (!visible) return null;

  return (
    <Loading
      variant={variant}
      text={text}
      overlay
      className="loading--fixed"
    />
  );
};

export default Loading;
import React from 'react';
import { ButtonProps } from '../../types';
import './Button.css';

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = ''
}) => {

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  const buttonClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    disabled && 'btn--disabled',
    loading && 'btn--loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}

      aria-busy={loading}
      aria-disabled={disabled}
    >
      {loading && (
        <span className="btn__spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="btn__spinner-icon">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="31.416"
              strokeDashoffset="31.416"
            />
          </svg>
        </span>
      )}
      <span className={loading ? 'btn__text--loading' : 'btn__text'}>
        {children}
      </span>
    </button>
  );
};

export default Button;
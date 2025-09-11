import React, { useState, useRef, useEffect } from 'react';
import { InputProps } from '../../types';
import './Input.css';

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  disabled = false,
  required = false,
  autoComplete,
  autoFocus = false,
  maxLength,
  minLength,
  pattern,
  className = '',
  icon,
  rightIcon,
  onRightIconClick,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasValue = value && value.toString().length > 0;
  const hasError = error && error.length > 0;

  const containerClasses = [
    'input-container',
    isFocused && 'input-container--focused',
    hasError && 'input-container--error',
    disabled && 'input-container--disabled',
    hasValue && 'input-container--has-value',
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'input',
    icon && 'input--with-icon',
    (rightIcon || type === 'password') && 'input--with-right-icon'
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label 
          className="input-label" 
          htmlFor={rest.id || rest.name}
        >
          {label}
          {required && <span className="input-label__required">*</span>}
        </label>
      )}
      
      <div className="input-wrapper">
        {icon && (
          <span className="input-icon input-icon--left" aria-hidden="true">
            {icon}
          </span>
        )}
        
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          className={inputClasses}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${rest.id || rest.name}-error` : undefined}
          {...rest}
        />
        
        {type === 'password' && (
          <button
            type="button"
            className="input-icon input-icon--right input-icon--password"
            onClick={handlePasswordToggle}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
        
        {rightIcon && type !== 'password' && (
          <button
            type="button"
            className="input-icon input-icon--right"
            onClick={onRightIconClick}
            aria-label="Ação do ícone"
            tabIndex={-1}
          >
            {rightIcon}
          </button>
        )}
      </div>
      
      {hasError && (
        <span 
          className="input-error" 
          id={`${rest.id || rest.name}-error`}
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
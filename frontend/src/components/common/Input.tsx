// Componente Input - DL Auto Peças

import React, { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import styled, { css } from 'styled-components';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

// ===== TIPOS =====
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled';
  fullWidth?: boolean;
  loading?: boolean;
}

// ===== STYLED COMPONENTS =====
const InputContainer = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.25rem;
`;

const InputWrapper = styled.div<{ 
  hasError?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled';
  disabled?: boolean;
  loading?: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  
  ${props => {
    const theme = props.theme;
    const baseStyles = css`
      border-radius: 8px;
      transition: all 0.2s ease;
      
      &:focus-within {
        box-shadow: 0 0 0 3px ${props.hasError ? theme.colors.error : theme.colors.primary}30;
      }
    `;
    
    if (props.variant === 'filled') {
      return css`
        ${baseStyles}
        background: ${theme.colors.surface};
        border: 1px solid transparent;
        
        &:focus-within {
          background: ${theme.colors.background};
          border-color: ${props.hasError ? theme.colors.error : theme.colors.primary};
        }
        
        ${props.hasError && css`
          border-color: ${theme.colors.error};
          background: ${theme.colors.error}10;
        `}
      `;
    }
    
    return css`
      ${baseStyles}
      background: ${theme.colors.background};
      border: 1px solid ${props.hasError ? theme.colors.error : theme.colors.border};
      
      &:focus-within {
        border-color: ${props.hasError ? theme.colors.error : theme.colors.primary};
      }
      
      &:hover:not(:focus-within) {
        border-color: ${props.hasError ? theme.colors.error : theme.colors.primary}80;
      }
    `;
  }}
  
  ${props => props.disabled && css`
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
      border-color: ${props.theme.colors.border} !important;
    }
  `}
  
  ${props => props.loading && css`
    &::after {
      content: '';
      position: absolute;
      right: 12px;
      width: 16px;
      height: 16px;
      border: 2px solid ${props.theme.colors.border};
      border-top: 2px solid ${props.theme.colors.primary};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}
`;

const StyledInput = styled.input<{
  hasLeftIcon?: boolean;
  hasRightIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
}>`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: ${props => props.theme.colors.text.primary};
  font-family: inherit;
  
  &::placeholder {
    color: ${props => props.theme.colors.text.secondary};
  }
  
  &:disabled {
    cursor: not-allowed;
  }
  
  ${props => {
    switch (props.size) {
      case 'small':
        return css`
          padding: 0.5rem;
          font-size: 0.875rem;
          height: 36px;
        `;
      case 'large':
        return css`
          padding: 1rem;
          font-size: 1.125rem;
          height: 52px;
        `;
      default:
        return css`
          padding: 0.75rem;
          font-size: 1rem;
          height: 44px;
        `;
    }
  }}
  
  ${props => props.hasLeftIcon && css`
    padding-left: 2.5rem;
  `}
  
  ${props => (props.hasRightIcon || props.loading) && css`
    padding-right: 2.5rem;
  `}
`;

const IconContainer = styled.div<{ position: 'left' | 'right' }>`
  position: absolute;
  ${props => props.position}: 0.75rem;
  display: flex;
  align-items: center;
  color: ${props => props.theme.colors.text.secondary};
  pointer-events: none;
  
  &.clickable {
    pointer-events: auto;
    cursor: pointer;

    &:hover {
      color: ${props => props.theme.colors.text.primary};
    }
  }
`;

const HelperText = styled.span<{ error?: boolean }>`
  font-size: 0.75rem;
  color: ${props => props.error ? props.theme.colors.error : props.theme.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
`;

// ===== COMPONENTE =====
export const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    size = 'medium',
    variant = 'outlined',
    fullWidth = false,
    loading = false,
    type = 'text',
    disabled,
    ...props
  },
  ref
) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const finalRightIcon = isPasswordType ? (
    <IconContainer 
      position="right" 
      className="clickable"
      onClick={togglePasswordVisibility}
    >
      {showPassword ? <FiEyeOff /> : <FiEye />}
    </IconContainer>
  ) : rightIcon ? (
    <IconContainer position="right">
      {rightIcon}
    </IconContainer>
  ) : null;
  
  return (
    <InputContainer fullWidth={fullWidth}>
      {label && <Label>{label}</Label>}
      
      <InputWrapper
        hasError={!!error}
        size={size}
        variant={variant}
        disabled={disabled}
        loading={loading}
      >
        {leftIcon && (
          <IconContainer position="left">
            {leftIcon}
          </IconContainer>
        )}
        
        <StyledInput
          ref={ref}
          type={inputType}
          hasLeftIcon={!!leftIcon}
          hasRightIcon={!!rightIcon || isPasswordType}
          size={size}
          disabled={disabled}
          loading={loading}
          {...props}
        />
        
        {finalRightIcon}
      </InputWrapper>
      
      {(error || helperText) && (
        <HelperText error={!!error}>
          {error && <FiAlertCircle size={12} />}
          {error || helperText}
        </HelperText>
      )}
    </InputContainer>
  );
});

Input.displayName = 'Input';

export default Input;
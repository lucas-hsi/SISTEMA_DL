// Componente Select - DL Auto Peças

import { SelectHTMLAttributes, ReactNode, forwardRef } from 'react';
import styled, { css, keyframes, DefaultTheme } from 'styled-components';
import { FiChevronDown, FiAlertCircle } from 'react-icons/fi';

// ===== TIPOS =====
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled';
  fullWidth?: boolean;
  loading?: boolean;
  options?: SelectOption[];
  placeholder?: string;
}

// ===== STYLED COMPONENTS =====
const SelectContainer = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
`;

interface LabelProps {
  theme: DefaultTheme;
}

const Label = styled.label<LabelProps>`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.25rem;
`;

interface SelectWrapperProps {
  hasError?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled';
  disabled?: boolean;
  loading?: boolean;
  theme: DefaultTheme;
}

const SelectWrapper = styled.div<SelectWrapperProps>`
  position: relative;
  display: flex;
  align-items: center;
  
  ${props => {
    const theme = props.theme;
    const baseStyles = css`
      border-radius: 8px;
      transition: all 0.2s ease;
      
      &:focus-within {
        box-shadow: 0 0 0 3px ${({ hasError, theme }) => hasError ? theme.colors.error : theme.colors.primary}30;
      }
    `;
    
    if (props.variant === 'filled') {
      return css`
        ${baseStyles}
        background: ${({ theme }) => theme.colors.surface};
        border: 1px solid transparent;
        
        &:focus-within {
          background: ${({ theme }) => theme.colors.background};
          border-color: ${({ hasError, theme }) => hasError ? theme.colors.error : theme.colors.primary};
        }
        
        ${props.hasError && css`
          border-color: ${({ theme }) => theme.colors.error};
          background: ${({ theme }) => theme.colors.error}10;
        `}
      `;
    }
    
    return css`
      ${baseStyles}
      background: ${({ theme }) => theme.colors.background};
      border: 1px solid ${({ hasError, theme }) => hasError ? theme.colors.error : theme.colors.border};
      
      &:focus-within {
        border-color: ${({ hasError, theme }) => hasError ? theme.colors.error : theme.colors.primary};
      }
      
      &:hover:not(:focus-within) {
        border-color: ${({ hasError, theme }) => hasError ? theme.colors.error : theme.colors.primary}80;
      }
    `;
  }}
  
  ${props => props.disabled && css`
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
        border-color: ${({ theme }) => theme.colors.border} !important;
      }
  `}
  
  ${props => props.loading && css`
    &::after {
      content: '';
      position: absolute;
      right: 40px;
      width: 16px;
      height: 16px;
      border: 2px solid ${({ theme }) => theme.colors.border};
      border-top: 2px solid ${({ theme }) => theme.colors.primary};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}
`;

interface StyledSelectProps {
  hasLeftIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  theme: DefaultTheme;
}

const StyledSelect = styled.select<StyledSelectProps>`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: ${props => props.theme.colors.text.primary};
  font-family: inherit;
  cursor: pointer;
  appearance: none;
  
  &:disabled {
    cursor: not-allowed;
  }
  
  option {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text.primary};
    padding: 0.5rem;

    &:disabled {
      color: ${({ theme }) => theme.colors.text.secondary};
      opacity: 0.6;
    }
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
  
  ${props => props.loading && css`
    padding-right: 4rem;
  `}
  
  padding-right: 2.5rem;
`;

interface IconContainerProps {
  position: 'left' | 'right';
  theme: DefaultTheme;
}

const IconContainer = styled.div<IconContainerProps>` 
  position: absolute;
  ${props => props.position}: 0.75rem;
  display: flex;
  align-items: center;
  color: ${props => props.theme.colors.text.secondary};
  pointer-events: none;
  z-index: 1;
`;

interface ChevronIconProps {
  loading?: boolean;
  theme: DefaultTheme;
}

const ChevronIcon = styled(FiChevronDown)<ChevronIconProps>`
  position: absolute;
  right: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
  pointer-events: none;
  transition: transform 0.2s ease;
  
  ${props => props.loading && css`
    right: 4rem;
  `}
  
  select:focus + & {
    transform: rotate(180deg);
  }
`;

interface HelperTextProps {
  error?: boolean;
  theme: DefaultTheme;
}

const HelperText = styled.span<HelperTextProps>`
  font-size: 0.75rem;
  color: ${({ theme, error }) => error ? theme.colors.error : theme.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
`;

// ===== COMPONENTE =====
export const Select = forwardRef<HTMLSelectElement, SelectProps>((
  {
    label,
    error,
    helperText,
    leftIcon,
    size = 'medium',
    variant = 'outlined',
    fullWidth = false,
    loading = false,
    options = [],
    placeholder,
    disabled,
    children,
    ...props
  },
  ref
) => {
  return (
    <SelectContainer fullWidth={fullWidth}>
      {label && <Label>{label}</Label>}
      
      <SelectWrapper
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
        
        <StyledSelect
          ref={ref}
          hasLeftIcon={!!leftIcon}
          size={size}
          disabled={disabled || loading}
          loading={loading}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
          
          {children}
        </StyledSelect>
        
        <ChevronIcon loading={loading} />
      </SelectWrapper>
      
      {(error || helperText) && (
        <HelperText error={!!error}>
          {error && <FiAlertCircle size={12} />}
          {error || helperText}
        </HelperText>
      )}
    </SelectContainer>
  );
});

Select.displayName = 'Select';

export default Select;
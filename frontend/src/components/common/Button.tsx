// Componente Button - DL Auto Peças

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { FiLoader } from 'react-icons/fi';

// ===== TIPOS =====
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
}

// ===== STYLED COMPONENTS =====
const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: ${props => props.rounded ? '50px' : '8px'};
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}30;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none !important;
  }
  
  &:not(:disabled):hover {
    transform: translateY(-1px);
  }
  
  &:not(:disabled):active {
    transform: translateY(0);
  }
  
  ${props => props.fullWidth && css`
    width: 100%;
  `}
  
  /* Tamanhos */
  ${props => {
    switch (props.size) {
      case 'small':
        return css`
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          min-height: 36px;
        `;
      case 'large':
        return css`
          padding: 1rem 2rem;
          font-size: 1.125rem;
          min-height: 52px;
        `;
      default:
        return css`
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          min-height: 44px;
        `;
    }
  }}
  
  /* Variantes */
  ${props => {
    const theme = props.theme;
    
    switch (props.variant) {
      case 'primary':
        return css`
          background: ${theme.colors.primary};
          color: white;
          
          &:not(:disabled):hover {
            background: ${theme.colors.primaryDark};
            box-shadow: 0 4px 12px ${theme.colors.primary}40;
          }
        `;
        
      case 'secondary':
        return css`
          background: ${theme.colors.surface};
          color: ${theme.colors.text.primary};
          border: 1px solid ${theme.colors.border};
          
          &:not(:disabled):hover {
            background: ${theme.colors.surfaceHover};
            border-color: ${theme.colors.primary};
          }
        `;
        
      case 'success':
        return css`
          background: ${theme.colors.success};
          color: white;
          
          &:not(:disabled):hover {
            background: ${theme.colors.successDark || theme.colors.success};
            box-shadow: 0 4px 12px ${theme.colors.success}40;
          }
        `;
        
      case 'warning':
        return css`
          background: ${theme.colors.warning};
          color: white;
          
          &:not(:disabled):hover {
            background: ${theme.colors.warningDark || theme.colors.warning};
            box-shadow: 0 4px 12px ${theme.colors.warning}40;
          }
        `;
        
      case 'error':
        return css`
          background: ${theme.colors.error};
          color: white;
          
          &:not(:disabled):hover {
            background: ${theme.colors.errorDark || theme.colors.error};
            box-shadow: 0 4px 12px ${theme.colors.error}40;
          }
        `;
        
      case 'ghost':
        return css`
          background: transparent;
          color: ${theme.colors.text.primary};
          
          &:not(:disabled):hover {
            background: ${theme.colors.surface};
          }
        `;
        
      default:
        return css`
          background: ${theme.colors.primary};
          color: white;
          
          &:not(:disabled):hover {
            background: ${theme.colors.primaryDark};
            box-shadow: 0 4px 12px ${theme.colors.primary}40;
          }
        `;
    }
  }}
`;

const LoadingSpinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ButtonContent = styled.span<{ loading?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: ${props => props.loading ? 0 : 1};
  transition: opacity 0.2s ease;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// ===== COMPONENTE =====
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;
  
  return (
    <StyledButton
      {...props}
      variant={variant}
      size={size}
      disabled={isDisabled}
    >
      <ButtonContent loading={loading}>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </ButtonContent>
      
      {loading && (
        <LoadingOverlay>
          <LoadingSpinner size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
        </LoadingOverlay>
      )}
    </StyledButton>
  );
};

export default Button;
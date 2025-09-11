// Componente Modal - DL Auto Peças

import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { css, keyframes } from 'styled-components';
import { FiX } from 'react-icons/fi';
import Button from './Button';

// ===== TIPOS =====
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: ReactNode;
  loading?: boolean;
  className?: string;
}

// ===== ANIMATIONS =====
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
`;

const slideOut = keyframes`
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
`;

// ===== STYLED COMPONENTS =====
const Overlay = styled.div<{ isClosing?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  
  animation: ${props => props.isClosing ? fadeOut : fadeIn} 0.2s ease;
`;

const ModalContainer = styled.div<{ 
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  isClosing?: boolean;
}>`
  background: ${props => props.theme.colors.background};
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  animation: ${props => props.isClosing ? slideOut : slideIn} 0.2s ease;
  
  ${props => {
    switch (props.size) {
      case 'small':
        return css`
          width: 400px;
          max-width: 90vw;
        `;
      
      case 'large':
        return css`
          width: 800px;
          max-width: 90vw;
        `;
      
      case 'fullscreen':
        return css`
          width: 95vw;
          height: 95vh;
          max-width: none;
          max-height: none;
        `;
      
      default:
        return css`
          width: 600px;
          max-width: 90vw;
        `;
    }
  }}
  
  @media (max-width: 768px) {
    width: 95vw;
    max-width: none;
    margin: 0 auto;
    
    ${props => props.size === 'fullscreen' && css`
      width: 100vw;
      height: 100vh;
      border-radius: 0;
    `}
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  flex-shrink: 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.surface};
    color: ${props => props.theme.colors.text.primary};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}30;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.surface};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 3px;
    
    &:hover {
      background: ${props => props.theme.colors.text.secondary};
    }
  }
`;

const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid ${props => props.theme.colors.border};
  flex-shrink: 0;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid ${props => props.theme.colors.border};
    border-top: 3px solid ${props => props.theme.colors.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// ===== COMPONENTE =====
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  loading = false,
  className
}) => {
  const [isClosing, setIsClosing] = React.useState(false);
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      handleClose();
    }
  };
  
  if (!isOpen && !isClosing) return null;
  
  const modalContent = (
    <Overlay isClosing={isClosing} onClick={handleOverlayClick}>
      <ModalContainer 
        size={size} 
        isClosing={isClosing}
        className={className}
      >
        {loading && (
          <LoadingOverlay>
            <div className="spinner" />
          </LoadingOverlay>
        )}
        
        {(title || showCloseButton) && (
          <ModalHeader>
            {title && <ModalTitle>{title}</ModalTitle>}
            {showCloseButton && (
              <CloseButton onClick={handleClose} type="button">
                <FiX size={18} />
              </CloseButton>
            )}
          </ModalHeader>
        )}
        
        <ModalBody>
          {children}
        </ModalBody>
        
        {footer && (
          <ModalFooter>
            {footer}
          </ModalFooter>
        )}
      </ModalContainer>
    </Overlay>
  );
  
  return createPortal(modalContent, document.body);
};

// ===== COMPONENTES AUXILIARES =====
export const ModalActions: React.FC<{
  onCancel?: () => void;
  onConfirm?: () => void;
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
  confirmVariant?: 'primary' | 'success' | 'warning' | 'error';
}> = ({
  onCancel,
  onConfirm,
  cancelText = 'Cancelar',
  confirmText = 'Confirmar',
  loading = false,
  confirmVariant = 'primary'
}) => {
  return (
    <>
      {onCancel && (
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelText}
        </Button>
      )}
      {onConfirm && (
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      )}
    </>
  );
};

export default Modal;
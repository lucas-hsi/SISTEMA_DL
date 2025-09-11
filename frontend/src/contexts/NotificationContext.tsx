import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import styled from 'styled-components';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
`;

const NotificationItem = styled.div<{ type: NotificationType }>`
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  }};
  display: flex;
  align-items: flex-start;
  gap: 12px;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const IconWrapper = styled.div<{ type: NotificationType }>`
  color: ${props => {
    switch (props.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  }};
  flex-shrink: 0;
  margin-top: 2px;
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled.h4`
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
`;

const Message = styled.p`
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &:hover {
    color: #6b7280;
  }
`;

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <FiCheckCircle size={18} />;
    case 'error':
      return <FiAlertCircle size={18} />;
    case 'warning':
      return <FiAlertTriangle size={18} />;
    case 'info':
      return <FiInfo size={18} />;
    default:
      return <FiInfo size={18} />;
  }
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove notification if not persistent
    if (!newNotification.persistent && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer>
        {notifications.map(notification => (
          <NotificationItem key={notification.id} type={notification.type}>
            <IconWrapper type={notification.type}>
              {getIcon(notification.type)}
            </IconWrapper>
            <Content>
              <Title>{notification.title}</Title>
              {notification.message && (
                <Message>{notification.message}</Message>
              )}
            </Content>
            <CloseButton onClick={() => removeNotification(notification.id)}>
              <FiX size={16} />
            </CloseButton>
          </NotificationItem>
        ))}
      </NotificationContainer>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
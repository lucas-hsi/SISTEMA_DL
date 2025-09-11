// Hook de Notificações - DL Auto Peças

import React, { useState, useCallback, useContext, createContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ===== TIPOS =====
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: Date;
}

export interface NotificationContextType {
  notifications: Notification[];
  showNotification: (
    message: string, 
    type?: NotificationType, 
    options?: Partial<Notification>
  ) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// ===== CONTEXTO =====
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ===== PROVIDER =====
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Mostrar notificação
  const showNotification = useCallback((
    message: string,
    type: NotificationType = 'info',
    options: Partial<Notification> = {}
  ): string => {
    const id = uuidv4();
    
    const notification: Notification = {
      id,
      type,
      message,
      duration: options.duration ?? (type === 'error' ? 8000 : 5000),
      persistent: options.persistent ?? false,
      title: options.title,
      action: options.action,
      createdAt: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remover se não for persistente
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, notification.duration);
    }
    
    return id;
  }, []);

  // Esconder notificação
  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Limpar todas as notificações
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextType = {
    notifications,
    showNotification,
    hideNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// ===== HOOK =====
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};

// ===== HOOKS AUXILIARES =====

// Hook para notificações de sucesso
export const useSuccessNotification = () => {
  const { showNotification } = useNotification();
  
  return useCallback((message: string, options?: Partial<Notification>) => {
    return showNotification(message, 'success', options);
  }, [showNotification]);
};

// Hook para notificações de erro
export const useErrorNotification = () => {
  const { showNotification } = useNotification();
  
  return useCallback((message: string, options?: Partial<Notification>) => {
    return showNotification(message, 'error', options);
  }, [showNotification]);
};

// Hook para notificações de aviso
export const useWarningNotification = () => {
  const { showNotification } = useNotification();
  
  return useCallback((message: string, options?: Partial<Notification>) => {
    return showNotification(message, 'warning', options);
  }, [showNotification]);
};

// Hook para notificações de informação
export const useInfoNotification = () => {
  const { showNotification } = useNotification();
  
  return useCallback((message: string, options?: Partial<Notification>) => {
    return showNotification(message, 'info', options);
  }, [showNotification]);
};

// Hook para notificações de loading
export const useLoadingNotification = () => {
  const { showNotification, hideNotification } = useNotification();
  
  const showLoading = useCallback((message: string = 'Carregando...') => {
    return showNotification(message, 'info', {
      persistent: true,
      duration: 0
    });
  }, [showNotification]);
  
  const hideLoading = useCallback((id: string) => {
    hideNotification(id);
  }, [hideNotification]);
  
  return { showLoading, hideLoading };
};

// Hook para notificações com ação
export const useActionNotification = () => {
  const { showNotification } = useNotification();
  
  return useCallback((
    message: string,
    actionLabel: string,
    actionCallback: () => void,
    type: NotificationType = 'info',
    options?: Partial<Notification>
  ) => {
    return showNotification(message, type, {
      ...options,
      action: {
        label: actionLabel,
        onClick: actionCallback
      },
      persistent: true
    });
  }, [showNotification]);
};

// Hook para notificações de confirmação
export const useConfirmNotification = () => {
  const { showNotification } = useNotification();
  
  return useCallback((
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: Partial<Notification>
  ) => {
    return showNotification(message, 'warning', {
      ...options,
      persistent: true,
      action: {
        label: 'Confirmar',
        onClick: onConfirm
      }
    });
  }, [showNotification]);
};

// Hook para notificações de progresso
export const useProgressNotification = () => {
  const { showNotification, hideNotification } = useNotification();
  
  const showProgress = useCallback((message: string, progress: number = 0) => {
    const progressMessage = `${message} (${Math.round(progress)}%)`;
    return showNotification(progressMessage, 'info', {
      persistent: true,
      duration: 0
    });
  }, [showNotification]);
  
  const updateProgress = useCallback((id: string, message: string, progress: number) => {
    hideNotification(id);
    return showProgress(message, progress);
  }, [hideNotification, showProgress]);
  
  const hideProgress = useCallback((id: string) => {
    hideNotification(id);
  }, [hideNotification]);
  
  return { showProgress, updateProgress, hideProgress };
};

// Hook para notificações de validação
export const useValidationNotification = () => {
  const { showNotification } = useNotification();
  
  const showValidationError = useCallback((errors: string[] | Record<string, string>) => {
    let message: string;
    
    if (Array.isArray(errors)) {
      message = errors.join(', ');
    } else {
      message = Object.values(errors).join(', ');
    }
    
    return showNotification(message, 'error', {
      title: 'Erro de Validação',
      duration: 6000
    });
  }, [showNotification]);
  
  const showFieldError = useCallback((field: string, error: string) => {
    return showNotification(`${field}: ${error}`, 'error', {
      duration: 4000
    });
  }, [showNotification]);
  
  return { showValidationError, showFieldError };
};

// Hook para notificações de rede
export const useNetworkNotification = () => {
  const { showNotification } = useNotification();
  
  const showNetworkError = useCallback((error?: string) => {
    const message = error || 'Erro de conexão. Verifique sua internet.';
    return showNotification(message, 'error', {
      title: 'Erro de Rede',
      duration: 8000
    });
  }, [showNotification]);
  
  const showOfflineNotification = useCallback(() => {
    return showNotification(
      'Você está offline. Algumas funcionalidades podem não estar disponíveis.',
      'warning',
      {
        title: 'Sem Conexão',
        persistent: true
      }
    );
  }, [showNotification]);
  
  const showOnlineNotification = useCallback(() => {
    return showNotification(
      'Conexão restaurada!',
      'success',
      {
        duration: 3000
      }
    );
  }, [showNotification]);
  
  return { 
    showNetworkError, 
    showOfflineNotification, 
    showOnlineNotification 
  };
};

export default useNotification;
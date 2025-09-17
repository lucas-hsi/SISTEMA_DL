'use client';

import React, { useEffect, useState } from 'react';
import { useAuthNotifications } from '@/hooks/useAuthNotifications';
import { X, CheckCircle, AlertTriangle, XCircle, Info, Wifi, WifiOff } from 'lucide-react';

interface AuthNotificationsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
  className?: string;
}

const AuthNotifications: React.FC<AuthNotificationsProps> = ({
  position = 'top-right',
  maxVisible = 3,
  className = ''
}) => {
  const {
    notifications,
    hideNotification,
    hasActiveNotifications
  } = useAuthNotifications();
  
  const [isVisible, setIsVisible] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);

  // Monitorar status da rede
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Controlar visibilidade do container
  useEffect(() => {
    if (hasActiveNotifications) {
      setIsVisible(true);
    } else {
      // Delay para animação de saída
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [hasActiveNotifications]);

  // Função para obter ícone baseado no tipo
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Função para obter classes de estilo baseado no tipo
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  // Função para obter classes de posição
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  };



  if (!isVisible) {
    return null;
  }

  const visibleNotifications = notifications.slice(-maxVisible);

  return (
    <>
      {/* Indicador de Status da Rede */}
      {!networkStatus && (
        <div className={`fixed z-50 ${getPositionStyles()} mb-2`}>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg shadow-lg border border-gray-600">
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium">Sem conexão</span>
          </div>
        </div>
      )}

      {/* Container de Notificações */}
      <div 
        className={`fixed z-40 ${getPositionStyles()} ${className}`}
        style={{ 
          marginTop: !networkStatus ? '60px' : '0px',
          transition: 'margin-top 0.3s ease'
        }}
      >
        <div className="flex flex-col gap-2 max-w-sm">
          {visibleNotifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`
                relative overflow-hidden rounded-lg border shadow-lg backdrop-blur-sm
                ${getTypeStyles(notification.type)}
                transform transition-all duration-300 ease-out
                hover:scale-105 hover:shadow-xl
                animate-in slide-in-from-right
              `}
              style={{
                animationDelay: `${index * 100}ms`,
                opacity: hasActiveNotifications ? 1 : 0,
                transform: hasActiveNotifications 
                  ? 'translateY(0) scale(1)' 
                  : 'translateY(-20px) scale(0.95)'
              }}
            >
              {/* Barra de Progresso (para notificações temporárias) */}
              {notification.duration && notification.duration > 0 && (
                <div className="absolute top-0 left-0 h-1 bg-current opacity-30">
                  <div 
                    className="h-full bg-current opacity-60 transition-all ease-linear"
                    style={{
                      width: '100%',
                      animation: `shrink ${notification.duration}ms linear forwards`
                    }}
                  />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Ícone */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {notification.message}
                    </p>

                    {/* Ações */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {notification.actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => {
                              action.action();
                              hideNotification(notification.id);
                            }}
                            className={`
                              px-3 py-1.5 text-xs font-medium rounded-md
                              transition-colors duration-200
                              ${action.variant === 'primary'
                                ? 'bg-current text-white hover:opacity-90'
                                : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                              }
                            `}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botão de Fechar */}
                  <button
                    onClick={() => hideNotification(notification.id)}
                    className="
                      flex-shrink-0 p-1 rounded-md
                      hover:bg-white hover:bg-opacity-20
                      transition-colors duration-200
                      focus:outline-none focus:ring-2 focus:ring-current focus:ring-opacity-50
                    "
                    aria-label="Fechar notificação"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


    </>
  );
};

export default AuthNotifications;
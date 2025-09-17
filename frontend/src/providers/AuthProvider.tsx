'use client';

import React, { useEffect } from 'react';
import { AuthProvider as AuthContextProvider } from '@/context/AuthContext';
import { AuthErrorProvider, useAuthError } from '@/context/AuthErrorContext';
import { useAuthNotifications } from '@/hooks/useAuthNotifications';
import { registerAuthErrorSystem } from '@/services/api';
import { registerNotificationSystem } from '@/services/tokenRefreshService';
import AuthNotifications from '@/components/auth/AuthNotifications';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Componente interno para registrar sistemas após providers estarem disponíveis
const AuthSystemIntegrator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { reportAuthError } = useAuthError();
  const notificationSystem = useAuthNotifications();

  useEffect(() => {
    // Criar adaptador para compatibilidade de tipos
    const notificationAdapter = {
      showNotification: (notification: { type: string; title: string; message: string; duration?: number }) => {
        notificationSystem.showNotification({
          type: notification.type as 'success' | 'warning' | 'error' | 'info',
          title: notification.title,
          message: notification.message,
          duration: notification.duration
        });
      },
      showTokenRefreshSuccess: notificationSystem.showTokenRefreshSuccess,
      showTokenRefreshWarning: notificationSystem.showTokenRefreshWarning
    };
    
    // Registrar sistema de notificações de erro no interceptador Axios
    registerAuthErrorSystem(reportAuthError, notificationAdapter);
    
    // Registrar sistema de notificações no serviço de renovação preventiva
    registerNotificationSystem(notificationAdapter);
    
    console.log('🔗 Sistemas de autenticação integrados com sucesso');
  }, [reportAuthError, notificationSystem]);

  return (
    <>
      {children}
      {/* Componente de notificações globais */}
      <AuthNotifications position="top-right" maxVisible={3} />
    </>
  );
};

// Provider principal que combina todos os sistemas de autenticação
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <AuthContextProvider>
      <AuthErrorProvider>
        <AuthSystemIntegrator>
          {children}
        </AuthSystemIntegrator>
      </AuthErrorProvider>
    </AuthContextProvider>
  );
};

export default AuthProvider;
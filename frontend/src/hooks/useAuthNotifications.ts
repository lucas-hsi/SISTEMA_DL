'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface AuthNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number; // em ms, 0 = permanente
  timestamp: number;
  actions?: {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }[];
}

interface UseAuthNotificationsReturn {
  // Estados
  notifications: AuthNotification[];
  hasActiveNotifications: boolean;
  
  // Funções principais
  showNotification: (notification: Omit<AuthNotification, 'id' | 'timestamp'>) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Funções de conveniência
  showTokenRefreshSuccess: () => void;
  showTokenRefreshWarning: (timeLeft: number) => void;
  showTokenExpiredError: () => void;
  showNetworkError: () => void;
  showReauthRequired: (onReauth: () => void) => void;
  showSessionRecovered: () => void;
  
  // Configurações
  setDefaultDuration: (duration: number) => void;
  pauseNotifications: () => void;
  resumeNotifications: () => void;
}

const DEFAULT_DURATION = 5000; // 5 segundos
const MAX_NOTIFICATIONS = 5;

export const useAuthNotifications = (): UseAuthNotificationsReturn => {
  const [notifications, setNotifications] = useState<AuthNotification[]>([]);
  const [defaultDuration, setDefaultDurationState] = useState(DEFAULT_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const counterRef = useRef(0);

  // Função para gerar ID único
  const generateId = useCallback(() => {
    counterRef.current += 1;
    return `auth-notification-${Date.now()}-${counterRef.current}`;
  }, []);

  // Função para limpar timeout
  const clearNotificationTimeout = useCallback((id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  // Função para agendar remoção automática
  const scheduleAutoRemoval = useCallback((id: string, duration: number) => {
    if (duration > 0 && !isPaused) {
      const timeout = setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        timeoutsRef.current.delete(id);
      }, duration);
      
      timeoutsRef.current.set(id, timeout);
    }
  }, [isPaused]);

  // Função principal para mostrar notificação
  const showNotification = useCallback((notification: Omit<AuthNotification, 'id' | 'timestamp'>) => {
    const id = generateId();
    const duration = notification.duration ?? defaultDuration;
    
    const newNotification: AuthNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration
    };

    setNotifications(prev => {
      // Remover notificações antigas se exceder o limite
      const updated = [...prev, newNotification];
      if (updated.length > MAX_NOTIFICATIONS) {
        const toRemove = updated.slice(0, updated.length - MAX_NOTIFICATIONS);
        toRemove.forEach(n => clearNotificationTimeout(n.id));
        return updated.slice(-MAX_NOTIFICATIONS);
      }
      return updated;
    });

    // Agendar remoção automática
    scheduleAutoRemoval(id, duration);

    console.log('📢 Notificação de autenticação:', {
      type: notification.type,
      title: notification.title,
      duration: duration > 0 ? `${duration}ms` : 'permanente'
    });

    return id;
  }, [generateId, defaultDuration, scheduleAutoRemoval, clearNotificationTimeout]);

  // Função para esconder notificação específica
  const hideNotification = useCallback((id: string) => {
    clearNotificationTimeout(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, [clearNotificationTimeout]);

  // Função para limpar todas as notificações
  const clearAllNotifications = useCallback(() => {
    // Limpar todos os timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
    
    setNotifications([]);
    console.log('🧹 Todas as notificações de autenticação foram limpas');
  }, []);

  // Funções de conveniência para casos específicos
  const showTokenRefreshSuccess = useCallback(() => {
    return showNotification({
      type: 'success',
      title: 'Token Renovado',
      message: 'Sua sessão foi renovada automaticamente.',
      duration: 3000
    });
  }, [showNotification]);

  const showTokenRefreshWarning = useCallback((timeLeft: number) => {
    const minutes = Math.ceil(timeLeft / 60000);
    return showNotification({
      type: 'warning',
      title: 'Sessão Expirando',
      message: `Sua sessão expira em ${minutes} minuto${minutes !== 1 ? 's' : ''}. Renovação automática em andamento.`,
      duration: 8000
    });
  }, [showNotification]);

  const showTokenExpiredError = useCallback(() => {
    return showNotification({
      type: 'error',
      title: 'Sessão Expirada',
      message: 'Sua sessão expirou. Por favor, faça login novamente.',
      duration: 0, // Permanente
      actions: [{
        label: 'Fazer Login',
        action: () => {
          // Será implementado pelo componente que usa o hook
          console.log('Redirecionando para login...');
        },
        variant: 'primary'
      }]
    });
  }, [showNotification]);

  const showNetworkError = useCallback(() => {
    return showNotification({
      type: 'error',
      title: 'Erro de Conexão',
      message: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
      duration: 8000,
      actions: [{
        label: 'Tentar Novamente',
        action: () => {
          // Será implementado pelo componente que usa o hook
          console.log('Tentando reconectar...');
        },
        variant: 'secondary'
      }]
    });
  }, [showNotification]);

  const showReauthRequired = useCallback((onReauth: () => void) => {
    return showNotification({
      type: 'warning',
      title: 'Reautenticação Necessária',
      message: 'Por segurança, precisamos confirmar sua identidade.',
      duration: 0, // Permanente
      actions: [{
        label: 'Confirmar Identidade',
        action: onReauth,
        variant: 'primary'
      }]
    });
  }, [showNotification]);

  const showSessionRecovered = useCallback(() => {
    return showNotification({
      type: 'success',
      title: 'Sessão Recuperada',
      message: 'Sua sessão foi restaurada com sucesso. Dados preservados.',
      duration: 5000
    });
  }, [showNotification]);

  // Função para definir duração padrão
  const setDefaultDuration = useCallback((duration: number) => {
    setDefaultDurationState(duration);
  }, []);

  // Função para pausar notificações
  const pauseNotifications = useCallback(() => {
    setIsPaused(true);
    // Pausar todos os timeouts ativos
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
  }, []);

  // Função para retomar notificações
  const resumeNotifications = useCallback(() => {
    setIsPaused(false);
    // Reagendar timeouts para notificações existentes
    setNotifications(prev => {
      prev.forEach(notification => {
        if (notification.duration && notification.duration > 0) {
          const elapsed = Date.now() - notification.timestamp;
          const remaining = notification.duration - elapsed;
          
          if (remaining > 0) {
            scheduleAutoRemoval(notification.id, remaining);
          } else {
            // Remover notificações que já deveriam ter expirado
            setTimeout(() => hideNotification(notification.id), 0);
          }
        }
      });
      return prev;
    });
  }, [scheduleAutoRemoval, hideNotification]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, [timeoutsRef]);

  // Estado derivado
  const hasActiveNotifications = notifications.length > 0;

  return {
    // Estados
    notifications,
    hasActiveNotifications,
    
    // Funções principais
    showNotification,
    hideNotification,
    clearAllNotifications,
    
    // Funções de conveniência
    showTokenRefreshSuccess,
    showTokenRefreshWarning,
    showTokenExpiredError,
    showNetworkError,
    showReauthRequired,
    showSessionRecovered,
    
    // Configurações
    setDefaultDuration,
    pauseNotifications,
    resumeNotifications
  };
};

export default useAuthNotifications;
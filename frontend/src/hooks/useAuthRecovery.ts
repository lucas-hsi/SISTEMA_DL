'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthError } from '@/context/AuthErrorContext';
import { useAuth } from '@/context/AuthContext';
import { useAuthNotifications } from './useAuthNotifications';
import { useRouter } from 'next/navigation';

interface AuthRecoveryOptions {
  // Configurações de recuperação
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  
  // Callbacks
  onRecoveryStart?: () => void;
  onRecoverySuccess?: () => void;
  onRecoveryFailed?: (error: Error) => void;
  onMaxRetriesReached?: () => void;
  
  // Configurações de preservação
  preserveFormData?: boolean;
  preserveUrl?: boolean;
}

interface UseAuthRecoveryReturn {
  // Estados
  isRecovering: boolean;
  recoveryAttempts: number;
  lastRecoveryError: Error | null;
  canRetry: boolean;
  
  // Funções principais
  startRecovery: (options?: Partial<AuthRecoveryOptions>) => Promise<boolean>;
  cancelRecovery: () => void;
  retryRecovery: () => Promise<boolean>;
  
  // Funções de conveniência
  recoverFromTokenExpiry: () => Promise<boolean>;
  recoverFromNetworkError: () => Promise<boolean>;
  recoverWithReauth: () => Promise<boolean>;
  
  // Configurações
  setRecoveryOptions: (options: Partial<AuthRecoveryOptions>) => void;
  resetRecoveryState: () => void;
}

const DEFAULT_OPTIONS: AuthRecoveryOptions = {
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 2000,
  preserveFormData: true,
  preserveUrl: true
};

export const useAuthRecovery = (initialOptions?: Partial<AuthRecoveryOptions>): UseAuthRecoveryReturn => {
  const [options, setOptions] = useState<AuthRecoveryOptions>({
    ...DEFAULT_OPTIONS,
    ...initialOptions
  });
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [lastRecoveryError, setLastRecoveryError] = useState<Error | null>(null);
  
  const { handleAuthRecovery, openReauthModal, clearAuthError } = useAuthError();
  const { refreshToken } = useAuth();
  const {
    showSessionRecovered,
    showReauthRequired,
    showNetworkError,
    clearAllNotifications
  } = useAuthNotifications();
  
  const router = useRouter();

  // Estado derivado
  const canRetry = recoveryAttempts < (options.maxRetries || DEFAULT_OPTIONS.maxRetries!);

  // Função principal para iniciar recuperação
  const startRecovery = useCallback(async (recoveryOptions?: Partial<AuthRecoveryOptions>): Promise<boolean> => {
    if (isRecovering) {
      console.log('⚠️ Recuperação já em andamento');
      return false;
    }

    const currentOptions = { ...options, ...recoveryOptions };
    setIsRecovering(true);
    setLastRecoveryError(null);
    
    try {
      console.log('🔄 Iniciando recuperação de autenticação...', {
        attempt: recoveryAttempts + 1,
        maxRetries: currentOptions.maxRetries
      });
      
      // Callback de início
      currentOptions.onRecoveryStart?.();
      
      // Tentar recuperação automática primeiro
      const tokenRefreshSuccess = await attemptTokenRefresh();
      
      if (tokenRefreshSuccess) {
        console.log('✅ Recuperação automática bem-sucedida');
        
        // Executar recuperação completa
        await handleAuthRecovery();
        
        // Mostrar notificação de sucesso
        showSessionRecovered();
        
        // Callback de sucesso
        currentOptions.onRecoverySuccess?.();
        
        // Reset do estado
        setRecoveryAttempts(0);
        clearAuthError();
        
        return true;
      } else {
        // Se falhou, incrementar tentativas
        const newAttempts = recoveryAttempts + 1;
        setRecoveryAttempts(newAttempts);
        
        if (newAttempts >= (currentOptions.maxRetries || DEFAULT_OPTIONS.maxRetries!)) {
          console.log('🚫 Máximo de tentativas de recuperação atingido');
          
          // Callback de máximo de tentativas
          currentOptions.onMaxRetriesReached?.();
          
          // Abrir modal de reautenticação como último recurso
          openReauthModal(currentOptions.preserveFormData);
          
          return false;
        } else if (currentOptions.autoRetry) {
          // Tentar novamente após delay
          console.log(`⏳ Tentando novamente em ${currentOptions.retryDelay}ms...`);
          
          setTimeout(() => {
            startRecovery(currentOptions);
          }, currentOptions.retryDelay);
          
          return false;
        }
      }
      
    } catch (error) {
      console.error('❌ Erro na recuperação de autenticação:', error);
      
      const recoveryError = error instanceof Error ? error : new Error('Erro desconhecido na recuperação');
      setLastRecoveryError(recoveryError);
      
      // Callback de erro
      currentOptions.onRecoveryFailed?.(recoveryError);
      
      // Incrementar tentativas
      setRecoveryAttempts(prev => prev + 1);
      
      return false;
    } finally {
      setIsRecovering(false);
    }
    
    return false;
  }, [isRecovering, recoveryAttempts, options, handleAuthRecovery, showSessionRecovered, clearAuthError, openReauthModal]);

  // Função para tentar renovação de token
  const attemptTokenRefresh = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Tentando renovação de token...');
      const success = await refreshToken();
      
      if (success) {
        console.log('✅ Token renovado com sucesso');
        return true;
      }
    } catch (error) {
      console.error('❌ Erro na renovação de token:', error);
    }
    
    return false;
  }, [refreshToken]);

  // Função para cancelar recuperação
  const cancelRecovery = useCallback(() => {
    setIsRecovering(false);
    console.log('🛑 Recuperação de autenticação cancelada');
  }, []);

  // Função para tentar novamente
  const retryRecovery = useCallback(async (): Promise<boolean> => {
    if (!canRetry) {
      console.log('⚠️ Máximo de tentativas atingido');
      return false;
    }
    
    return startRecovery();
  }, [canRetry, startRecovery]);

  // Funções de conveniência para casos específicos
  const recoverFromTokenExpiry = useCallback(async (): Promise<boolean> => {
    return startRecovery({
      autoRetry: true,
      maxRetries: 2,
      preserveFormData: true
    });
  }, [startRecovery]);

  const recoverFromNetworkError = useCallback(async (): Promise<boolean> => {
    return startRecovery({
      autoRetry: true,
      maxRetries: 5,
      retryDelay: 3000,
      preserveFormData: true
    });
  }, [startRecovery]);

  const recoverWithReauth = useCallback(async (): Promise<boolean> => {
    // Abrir modal de reautenticação diretamente
    openReauthModal(options.preserveFormData);
    return false;
  }, [openReauthModal, options.preserveFormData]);

  // Função para definir opções de recuperação
  const setRecoveryOptions = useCallback((newOptions: Partial<AuthRecoveryOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  // Função para resetar estado de recuperação
  const resetRecoveryState = useCallback(() => {
    setIsRecovering(false);
    setRecoveryAttempts(0);
    setLastRecoveryError(null);
    console.log('🔄 Estado de recuperação resetado');
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (isRecovering) {
        cancelRecovery();
      }
    };
  }, [isRecovering, cancelRecovery]);

  return {
    // Estados
    isRecovering,
    recoveryAttempts,
    lastRecoveryError,
    canRetry,
    
    // Funções principais
    startRecovery,
    cancelRecovery,
    retryRecovery,
    
    // Funções de conveniência
    recoverFromTokenExpiry,
    recoverFromNetworkError,
    recoverWithReauth,
    
    // Configurações
    setRecoveryOptions,
    resetRecoveryState
  };
};

export default useAuthRecovery;
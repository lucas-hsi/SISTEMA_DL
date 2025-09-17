'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ReauthModal from '@/components/auth/ReauthModal';
import { useFormPreservation } from '@/hooks/useFormPreservation';

interface AuthError {
  type: 'token_expired' | 'refresh_failed' | 'network_error' | 'unauthorized';
  message: string;
  timestamp: number;
  retryCount: number;
}

interface AuthErrorContextType {
  // Estados
  currentError: AuthError | null;
  isReauthModalOpen: boolean;
  isRecovering: boolean;
  
  // Funções de controle de erro
  reportAuthError: (type: AuthError['type'], message: string) => void;
  clearAuthError: () => void;
  
  // Funções de modal
  openReauthModal: (preserveCurrentForm?: boolean) => void;
  closeReauthModal: () => void;
  
  // Funções de recuperação
  handleAuthRecovery: () => Promise<void>;
  
  // Estatísticas
  getErrorStats: () => {
    totalErrors: number;
    lastErrorTime: number | null;
    errorsByType: Record<string, number>;
  };
}

const AuthErrorContext = createContext<AuthErrorContextType | undefined>(undefined);

interface AuthErrorProviderProps {
  children: ReactNode;
}

export const AuthErrorProvider: React.FC<AuthErrorProviderProps> = ({ children }) => {
  const [currentError, setCurrentError] = useState<AuthError | null>(null);
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [errorHistory, setErrorHistory] = useState<AuthError[]>([]);
  
  const {
    preserveFormData,
    restoreData,
    hasPreservedData,
    getPreservedInfo,
    preservedData
  } = useFormPreservation();

  // Função para abrir modal de reautenticação
  const openReauthModal = useCallback((preserveCurrentForm?: boolean) => {
    if (preserveCurrentForm) {
      // Preservar dados do formulário atual se solicitado
      const formElements = document.querySelectorAll('input, textarea, select');
      const formData: Record<string, any> = {};
      
      formElements.forEach((element: any) => {
        if (element.name && element.value) {
          formData[element.name] = element.value;
        }
      });
      
      if (Object.keys(formData).length > 0) {
        preserveFormData(formData);
        console.log('💾 Dados do formulário preservados antes da reautenticação');
      }
    }
    
    setIsReauthModalOpen(true);
    console.log('🔐 Modal de reautenticação aberto');
  }, [preserveFormData]);

  // Função para fechar modal de reautenticação
  const closeReauthModal = useCallback(() => {
    setIsReauthModalOpen(false);
    console.log('❌ Modal de reautenticação fechado');
  }, []);

  // Função para reportar erro de autenticação
  const reportAuthError = useCallback((type: AuthError['type'], message: string) => {
    const error: AuthError = {
      type,
      message,
      timestamp: Date.now(),
      retryCount: 0
    };

    // Verificar se é o mesmo tipo de erro recente (evitar spam)
    const recentSimilarError = errorHistory.find(
      e => e.type === type && Date.now() - e.timestamp < 5000 // 5 segundos
    );

    if (recentSimilarError) {
      console.log('⚠️ Erro similar recente ignorado:', type);
      return;
    }

    console.error('🚨 Erro de autenticação reportado:', {
      type,
      message,
      timestamp: new Date(error.timestamp).toISOString()
    });

    setCurrentError(error);
    setErrorHistory(prev => [...prev.slice(-9), error]); // Manter últimos 10 erros

    // Auto-abrir modal para erros críticos
    if (type === 'token_expired' || type === 'refresh_failed') {
      openReauthModal(true);
    }
  }, [errorHistory, openReauthModal]);

  // Função para limpar erro atual
  const clearAuthError = useCallback(() => {
    setCurrentError(null);
    console.log('✅ Erro de autenticação limpo');
  }, []);

  // Função para lidar com recuperação de autenticação
  const handleAuthRecovery = useCallback(async () => {
    setIsRecovering(true);
    
    try {
      console.log('🔄 Iniciando recuperação de autenticação...');
      
      // Restaurar dados preservados
      const { formData, url } = await restoreData();
      
      if (formData) {
        console.log('📥 Dados restaurados:', {
          formsCount: Object.keys(formData).length,
          targetUrl: url
        });
        
        // Tentar restaurar dados nos formulários
        setTimeout(() => {
          try {
            Object.entries(formData).forEach(([formKey, fields]) => {
              if (typeof fields === 'object' && fields !== null) {
                Object.entries(fields as Record<string, unknown>).forEach(([fieldName, value]) => {
                  const input = document.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
                  if (input && typeof value === 'string') {
                    input.value = value;
                    
                    // Disparar evento de mudança para frameworks
                    const event = new Event('input', { bubbles: true });
                    input.dispatchEvent(event);
                  }
                });
              }
            });
            
            console.log('✅ Dados de formulário restaurados na página');
          } catch (error) {
            console.warn('⚠️ Erro ao restaurar dados na página:', error);
          }
        }, 500); // Aguardar renderização
      }
      
      // Limpar erro atual
      clearAuthError();
      
      console.log('✅ Recuperação de autenticação concluída');
      
    } catch (error) {
      console.error('❌ Erro na recuperação de autenticação:', error);
      throw error;
    } finally {
      setIsRecovering(false);
    }
  }, [restoreData, clearAuthError]);

  // Função para obter estatísticas de erros
  const getErrorStats = useCallback(() => {
    const errorsByType = errorHistory.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: errorHistory.length,
      lastErrorTime: errorHistory.length > 0 ? errorHistory[errorHistory.length - 1].timestamp : null,
      errorsByType
    };
  }, [errorHistory]);

  const contextValue: AuthErrorContextType = {
    // Estados
    currentError,
    isReauthModalOpen,
    isRecovering,
    
    // Funções de controle de erro
    reportAuthError,
    clearAuthError,
    
    // Funções de modal
    openReauthModal,
    closeReauthModal,
    
    // Funções de recuperação
    handleAuthRecovery,
    
    // Estatísticas
    getErrorStats
  };

  return (
    <AuthErrorContext.Provider value={contextValue}>
      {children}
      
      {/* Modal de Reautenticação */}
      <ReauthModal
        isOpen={isReauthModalOpen}
        onClose={closeReauthModal}
        onSuccess={handleAuthRecovery}
        preserveUrl={getPreservedInfo()?.url}
        formData={hasPreservedData() ? preservedData?.formData : undefined}
      />
    </AuthErrorContext.Provider>
  );
};

export const useAuthError = (): AuthErrorContextType => {
  const context = useContext(AuthErrorContext);
  if (context === undefined) {
    throw new Error('useAuthError deve ser usado dentro de um AuthErrorProvider');
  }
  return context;
};

export default AuthErrorContext;
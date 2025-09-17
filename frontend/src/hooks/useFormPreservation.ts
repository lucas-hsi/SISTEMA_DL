'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PreservedData<T = Record<string, unknown>> {
  formData?: T;
  url?: string;
  timestamp: number;
}

const STORAGE_KEY = 'preserved_session_data';
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutos

export const useFormPreservation = <T = Record<string, unknown>>() => {
  const router = useRouter();
  const [preservedData, setPreservedData] = useState<PreservedData<T> | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Função para limpar dados preservados
  const clearPreservedData = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      setPreservedData(null);
      console.log('🗑️ Dados preservados removidos');
    } catch (error) {
      console.error('❌ Erro ao limpar dados preservados:', error);
    }
  }, []);

  // Função para carregar dados preservados
  const loadPreservedData = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const data: PreservedData<T> = JSON.parse(stored);
        
        // Verificar se não expirou
        if (Date.now() - data.timestamp < EXPIRY_TIME) {
          setPreservedData(data);
          console.log('📥 Dados preservados carregados:', {
            url: data.url,
            age: Math.round((Date.now() - data.timestamp) / 1000) + 's'
          });
        } else {
          console.log('⏰ Dados preservados expiraram, removendo...');
          clearPreservedData();
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados preservados:', error);
      clearPreservedData();
    }
  }, [clearPreservedData]);

  // Função para salvar dados do formulário
  const preserveFormData = useCallback((formData: T, currentUrl?: string) => {
    const dataToPreserve: PreservedData<T> = {
      formData,
      url: currentUrl || window.location.pathname + window.location.search,
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToPreserve));
      setPreservedData(dataToPreserve);
      
      console.log('💾 Dados do formulário preservados:', {
        url: dataToPreserve.url,
        fieldsCount: Object.keys(formData || {}).length
      });
    } catch (error) {
      console.error('❌ Erro ao preservar dados:', error);
    }
  }, []);

  // Carregar dados preservados na inicialização
  useEffect(() => {
    loadPreservedData();
  }, [loadPreservedData]);

  // Função para restaurar dados
  const restoreData = useCallback(async () => {
    if (!preservedData) {
      console.log('ℹ️ Nenhum dado para restaurar');
      return { formData: null, url: null };
    }

    setIsRestoring(true);

    try {
      console.log('🔄 Restaurando dados preservados...');
      
      const { formData, url } = preservedData;
      
      // Limpar dados após restauração
      clearPreservedData();
      
      // Redirecionar para URL preservada se diferente da atual
      if (url && url !== window.location.pathname + window.location.search) {
        console.log('🔀 Redirecionando para URL preservada:', url);
        router.push(url);
      }
      
      console.log('✅ Dados restaurados com sucesso');
      
      return { formData, url };
    } catch (error) {
      console.error('❌ Erro ao restaurar dados:', error);
      return { formData: null, url: null };
    } finally {
      setIsRestoring(false);
    }
  }, [preservedData, router, clearPreservedData]);

  // Função para verificar se há dados preservados
  const hasPreservedData = useCallback(() => {
    return preservedData !== null;
  }, [preservedData]);

  // Função para obter informações dos dados preservados
  const getPreservedInfo = useCallback(() => {
    if (!preservedData) return null;
    
    return {
      url: preservedData.url,
      fieldsCount: Object.keys(preservedData.formData || {}).length,
      age: Date.now() - preservedData.timestamp,
      isExpired: Date.now() - preservedData.timestamp > EXPIRY_TIME
    };
  }, [preservedData]);

  // Hook para auto-preservar dados de formulário
  const useAutoPreserve = (formData: T, dependencies: unknown[] = []) => {
    useEffect(() => {
      if (formData && Object.keys(formData).length > 0) {
        // Debounce para evitar muitas gravações
        const timeoutId = setTimeout(() => {
          preserveFormData(formData);
        }, 1000);

        return () => clearTimeout(timeoutId);
      }
    }, [formData, preserveFormData, ...dependencies]);
  };

  // Listener para detectar quando o usuário está saindo da página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (preservedData) {
        e.preventDefault();
        e.returnValue = 'Você tem dados não salvos. Tem certeza que deseja sair?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [preservedData]);

  return {
    // Estados
    preservedData,
    isRestoring,
    
    // Funções principais
    preserveFormData,
    restoreData,
    clearPreservedData,
    
    // Utilitários
    hasPreservedData,
    getPreservedInfo,
    loadPreservedData,
    
    // Hook auxiliar
    useAutoPreserve
  };
};

export default useFormPreservation;
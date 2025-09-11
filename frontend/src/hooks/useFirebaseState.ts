import { useState, useCallback, useRef } from 'react';
import { FirebaseError } from 'firebase/app';

// Tipos para estados do Firebase
export interface FirebaseState<T = any> {
  data: T | null;
  loading: boolean;
  error: FirebaseError | Error | null;
  success: boolean;
}

// Opções para operações Firebase
export interface FirebaseOperationOptions {
  showSuccessMessage?: boolean;
  successMessage?: string;
  onSuccess?: (data?: any) => void;
  onError?: (error: FirebaseError | Error) => void;
  retryable?: boolean;
  maxRetries?: number;
}

/**
 * Hook personalizado para gerenciar estados de operações Firebase
 * Fornece controle unificado de loading, erro e sucesso
 */
export const useFirebaseState = <T = any>(initialData: T | null = null) => {
  const [state, setState] = useState<FirebaseState<T>>({
    data: initialData,
    loading: false,
    error: null,
    success: false
  });

  const retryCountRef = useRef(0);
  const lastOperationRef = useRef<(() => Promise<any>) | null>(null);

  // Resetar estado
  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      success: false
    });
    retryCountRef.current = 0;
    lastOperationRef.current = null;
  }, [initialData]);

  // Definir loading
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: null, success: false }));
  }, []);

  // Definir dados com sucesso
  const setData = useCallback((data: T) => {
    setState({
      data,
      loading: false,
      error: null,
      success: true
    });
  }, []);

  // Definir erro
  const setError = useCallback((error: FirebaseError | Error) => {
    setState(prev => ({
      ...prev,
      loading: false,
      error,
      success: false
    }));
  }, []);

  // Executar operação Firebase com tratamento automático
  const execute = useCallback(async <R = T>(
    operation: () => Promise<R>,
    options: FirebaseOperationOptions = {}
  ): Promise<R | null> => {
    const {
      showSuccessMessage = false,
      successMessage = 'Operação realizada com sucesso',
      onSuccess,
      onError,
      retryable = false,
      maxRetries = 3
    } = options;

    // Armazenar operação para retry
    lastOperationRef.current = operation;
    
    try {
      setLoading(true);
      
      const result = await operation();
      
      // Sucesso
      setState({
        data: result as unknown as T,
        loading: false,
        error: null,
        success: true
      });

      // Callback de sucesso
      if (onSuccess) {
        onSuccess(result);
      }

      // Mostrar mensagem de sucesso se solicitado
      if (showSuccessMessage) {
        console.log(successMessage);
        // Aqui você pode integrar com um sistema de notificações
      }

      retryCountRef.current = 0;
      return result;
      
    } catch (error) {
      const firebaseError = error as FirebaseError | Error;
      
      // Verificar se deve tentar novamente
      if (retryable && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.warn(`Tentativa ${retryCountRef.current} de ${maxRetries} falhou:`, firebaseError.message);
        
        // Aguardar antes de tentar novamente (backoff exponencial)
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return execute(operation, options);
      }
      
      // Definir erro
      setError(firebaseError);
      
      // Callback de erro
      if (onError) {
        onError(firebaseError);
      }
      
      retryCountRef.current = 0;
      return null;
    }
  }, [setLoading, setError]);

  // Tentar novamente a última operação
  const retry = useCallback(async () => {
    if (lastOperationRef.current) {
      return execute(lastOperationRef.current, { retryable: true });
    }
    return null;
  }, [execute]);

  // Verificar se é um erro específico do Firebase
  const isFirebaseError = useCallback((code?: string) => {
    if (!state.error) return false;
    
    const error = state.error as FirebaseError;
    if (code) {
      return error.code === code;
    }
    
    return 'code' in error;
  }, [state.error]);

  // Obter mensagem de erro amigável
  const getErrorMessage = useCallback(() => {
    if (!state.error) return null;
    
    const error = state.error as FirebaseError;
    
    // Mensagens específicas do Firebase
    const firebaseMessages: Record<string, string> = {
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/email-already-in-use': 'Este email já está em uso',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
      'auth/invalid-email': 'Email inválido',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
      'firestore/permission-denied': 'Permissão negada',
      'firestore/unavailable': 'Serviço temporariamente indisponível',
      'firestore/deadline-exceeded': 'Operação expirou. Tente novamente',
      'firestore/not-found': 'Documento não encontrado',
      'firestore/already-exists': 'Documento já existe'
    };
    
    if ('code' in error && firebaseMessages[error.code]) {
      return firebaseMessages[error.code];
    }
    
    return error.message || 'Erro desconhecido';
  }, [state.error]);

  return {
    // Estado atual
    ...state,
    
    // Ações
    reset,
    setLoading,
    setData,
    setError,
    execute,
    retry,
    
    // Utilitários
    isFirebaseError,
    getErrorMessage,
    
    // Informações adicionais
    canRetry: !!lastOperationRef.current,
    retryCount: retryCountRef.current
  };
};

/**
 * Hook para múltiplos estados Firebase
 * Útil quando você precisa gerenciar várias operações simultaneamente
 */
export const useMultipleFirebaseStates = <T extends Record<string, any>>(
  initialStates: Partial<T> = {}
) => {
  const [states, setStates] = useState<Record<keyof T, FirebaseState>>(() => {
    const initial: Record<keyof T, FirebaseState> = {} as any;
    
    Object.keys(initialStates).forEach(key => {
      initial[key as keyof T] = {
        data: initialStates[key as keyof T] || null,
        loading: false,
        error: null,
        success: false
      };
    });
    
    return initial;
  });

  // Atualizar estado específico
  const updateState = useCallback(<K extends keyof T>(
    key: K,
    update: Partial<FirebaseState<T[K]>>
  ) => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], ...update }
    }));
  }, []);

  // Resetar estado específico
  const resetState = useCallback(<K extends keyof T>(key: K) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        data: initialStates[key] || null,
        loading: false,
        error: null,
        success: false
      }
    }));
  }, [initialStates]);

  // Resetar todos os estados
  const resetAll = useCallback(() => {
    const reset: Record<keyof T, FirebaseState> = {} as any;
    
    Object.keys(states).forEach(key => {
      reset[key as keyof T] = {
        data: initialStates[key as keyof T] || null,
        loading: false,
        error: null,
        success: false
      };
    });
    
    setStates(reset);
  }, [states, initialStates]);

  // Verificar se algum estado está carregando
  const isAnyLoading = useCallback(() => {
    return Object.values(states).some(state => state.loading);
  }, [states]);

  // Verificar se algum estado tem erro
  const hasAnyError = useCallback(() => {
    return Object.values(states).some(state => state.error);
  }, [states]);

  return {
    states,
    updateState,
    resetState,
    resetAll,
    isAnyLoading,
    hasAnyError
  };
};

/**
 * Hook para operações Firebase com cache
 * Útil para dados que não mudam frequentemente
 */
export const useFirebaseCache = <T = any>(
  fetcher: () => Promise<T>,
  options: {
    ttl?: number; // Time to live em milissegundos
    staleWhileRevalidate?: boolean;
  } = {}
) => {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true } = options; // 5 minutos por padrão
  
  const firebaseState = useFirebaseState<T>();
  const cacheRef = useRef<{
    data: T;
    timestamp: number;
  } | null>(null);

  // Verificar se o cache é válido
  const isCacheValid = useCallback(() => {
    if (!cacheRef.current) return false;
    
    const now = Date.now();
    const age = now - cacheRef.current.timestamp;
    
    return age < ttl;
  }, [ttl]);

  // Buscar dados com cache
  const fetchWithCache = useCallback(async (forceRefresh = false) => {
    // Se tem cache válido e não é refresh forçado
    if (!forceRefresh && isCacheValid() && cacheRef.current) {
      firebaseState.setData(cacheRef.current.data);
      return cacheRef.current.data;
    }

    // Se tem cache mas está stale, retornar dados antigos enquanto busca novos
    if (staleWhileRevalidate && cacheRef.current && !firebaseState.loading) {
      firebaseState.setData(cacheRef.current.data);
    }

    // Buscar dados frescos
    const result = await firebaseState.execute(fetcher);
    
    if (result) {
      // Atualizar cache
      cacheRef.current = {
        data: result,
        timestamp: Date.now()
      };
    }
    
    return result;
  }, [fetcher, firebaseState, isCacheValid, staleWhileRevalidate]);

  // Invalidar cache
  const invalidateCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  return {
    ...firebaseState,
    fetchWithCache,
    invalidateCache,
    isCacheValid: isCacheValid(),
    cacheAge: cacheRef.current ? Date.now() - cacheRef.current.timestamp : null
  };
};
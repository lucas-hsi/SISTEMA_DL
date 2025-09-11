import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  FirestoreService,
  clientesService,
  produtosService,
  pedidosService,
  usuariosService,
  anunciosService,
  estoqueService,
  createFirestoreService
} from '../services/firestoreService';
import {
  firebaseAuthService,
  FirebaseAuthState,
  FirebaseUserProfile,
  FirebaseLoginCredentials,
  FirebaseRegisterData
} from '../services/firebaseAuthService';
import { db, firebaseSettings } from '../services/firebase';
import { useFirebaseErrorHandler } from '../components/Firebase/FirebaseErrorBoundary';
import { useFirebaseState } from '../hooks/useFirebaseState';

// Tipos para o contexto Firebase
export interface FirebaseContextType {
  // Estado de autenticação
  authState: FirebaseAuthState;
  
  // Serviços CRUD pré-configurados
  services: {
    clientes: FirestoreService;
    produtos: FirestoreService;
    pedidos: FirestoreService;
    usuarios: FirestoreService;
    anuncios: FirestoreService;
    estoque: FirestoreService;
  };
  
  // Funções de autenticação
  auth: {
    login: (credentials: FirebaseLoginCredentials) => Promise<void>;
    register: (data: FirebaseRegisterData) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isAuthenticated: () => boolean;
    getCurrentUser: () => FirebaseUserProfile | null;
  };
  
  // Utilitários
  utils: {
    createService: (collectionName: string) => FirestoreService;
    getDatabase: () => typeof db;
    getSettings: () => typeof firebaseSettings;
  };
  
  // Estados de carregamento e erro
  loading: boolean;
  error: string | null;
  
  // Estados globais de loading e erro
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // Tratamento de erros centralizado
  handleError: (error: Error, context?: string) => void;
  clearErrors: () => void;
  
  // Funções de controle de estado
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Contexto Firebase
const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// Props do provider
interface FirebaseProviderProps {
  children: ReactNode;
}

/**
 * Provider do contexto Firebase
 * Fornece acesso centralizado a todos os serviços Firebase:
 * - Autenticação
 * - Serviços CRUD do Firestore
 * - Estados de carregamento e erro
 * - Utilitários e configurações
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  // Estados locais
  const [authState, setAuthState] = useState<FirebaseAuthState>({
    user: null,
    userProfile: null,
    loading: true,
    error: null
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);
  
  // Estados de erro usando o hook personalizado
  const firebaseState = useFirebaseState<any>(null);
  const errorHandler = useFirebaseErrorHandler();

  // Inicializar listener de autenticação
  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChange((newAuthState) => {
      setAuthState(newAuthState);
    });

    return unsubscribe;
  }, []);

  // Tratamento de erros centralizado
  const handleError = (error: Error, context?: string) => {
    console.error(`Firebase Error${context ? ` (${context})` : ''}:`, error);
    errorHandler.handleError(error, context);
    setError(error.message);
  };

  const clearErrors = () => {
    firebaseState.reset();
    setError(null);
  };

  // Funções de autenticação com tratamento de erro
  const handleLogin = async (credentials: FirebaseLoginCredentials): Promise<void> => {
    await firebaseState.execute(
      () => firebaseAuthService.loginFirebase(credentials),
      {
        onSuccess: () => {
          console.log('Login realizado com sucesso');
        },
        onError: (error) => handleError(error, 'Login'),
        retryable: true,
        maxRetries: 2
      }
    );
  };

  const handleRegister = async (data: FirebaseRegisterData): Promise<void> => {
    await firebaseState.execute(
      () => firebaseAuthService.registerFirebase(data),
      {
        onSuccess: () => {
          console.log('Registro realizado com sucesso');
        },
        onError: (error) => handleError(error, 'Registro'),
        showSuccessMessage: true,
        successMessage: 'Conta criada com sucesso!'
      }
    );
  };

  const handleLogout = async (): Promise<void> => {
    await firebaseState.execute(
      () => firebaseAuthService.logoutFirebase(),
      {
        onSuccess: () => {
          console.log('Logout realizado com sucesso');
        },
        onError: (error) => handleError(error, 'Logout')
      }
    );
  };

  const handleResetPassword = async (email: string): Promise<void> => {
    await firebaseState.execute(
      () => firebaseAuthService.resetPasswordFirebase(email),
      {
        onSuccess: () => {
          console.log('Email de recuperação enviado com sucesso');
        },
        onError: (error) => handleError(error, 'Reset Password'),
        showSuccessMessage: true,
        successMessage: 'Email de recuperação enviado!'
      }
    );
  };

  // Função para limpar erro
  const clearError = (): void => {
    setError(null);
  };

  // Função para controlar loading
  const setLoadingState = (loadingState: boolean): void => {
    setLoading(loadingState);
  };

  // Valor do contexto
  const contextValue: FirebaseContextType = {
    // Estado de autenticação
    authState,
    
    // Serviços CRUD pré-configurados
    services: {
      clientes: clientesService,
      produtos: produtosService,
      pedidos: pedidosService,
      usuarios: usuariosService,
      anuncios: anunciosService,
      estoque: estoqueService
    },
    
    // Funções de autenticação
    auth: {
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      resetPassword: handleResetPassword,
      isAuthenticated: () => firebaseAuthService.isFirebaseAuthenticated(),
      getCurrentUser: () => firebaseAuthService.getCurrentFirebaseUserProfile()
    },
    
    // Utilitários
    utils: {
      createService: createFirestoreService,
      getDatabase: () => db,
      getSettings: () => firebaseSettings
    },
    
    // Estados de carregamento e erro
    loading: loading || authState.loading || firebaseState.loading,
    error: error || authState.error || firebaseState.error?.message || null,
    
    // Estados globais
    globalLoading,
    setGlobalLoading,
    
    // Tratamento de erros
    handleError,
    clearErrors,
    
    // Funções de controle de estado
    clearError,
    setLoading: setLoadingState
  };

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook para usar o contexto Firebase
 * @returns Contexto Firebase
 * @throws Error se usado fora do FirebaseProvider
 */
export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  
  if (context === undefined) {
    throw new Error('useFirebase deve ser usado dentro de um FirebaseProvider');
  }
  
  return context;
};

/**
 * Hook para usar apenas a autenticação Firebase
 * @returns Funções e estado de autenticação
 */
export const useFirebaseAuth = () => {
  const { authState, auth, loading, error, clearError } = useFirebase();
  
  return {
    ...authState,
    ...auth,
    loading,
    error,
    clearError
  };
};

/**
 * Hook para usar os serviços CRUD do Firestore
 * @returns Serviços CRUD pré-configurados
 */
export const useFirestoreServices = () => {
  const { services, utils } = useFirebase();
  
  return {
    ...services,
    createService: utils.createService
  };
};

/**
 * Hook para usar um serviço específico do Firestore
 * @param serviceName Nome do serviço
 * @returns Serviço específico
 */
export const useFirestoreService = (serviceName: keyof FirebaseContextType['services']) => {
  const { services } = useFirebase();
  return services[serviceName];
};

/**
 * Hook para criar um serviço customizado do Firestore
 * @param collectionName Nome da coleção
 * @returns Serviço customizado
 */
export const useCustomFirestoreService = (collectionName: string) => {
  const { utils } = useFirebase();
  const [service] = useState(() => utils.createService(collectionName));
  return service;
};

/**
 * Hook para monitorar mudanças em tempo real
 * @param serviceName Nome do serviço
 * @param options Opções de consulta
 * @returns Dados em tempo real
 */
export const useFirestoreRealtime = <T = any>(
  serviceName: keyof FirebaseContextType['services'],
  options?: Parameters<FirestoreService['onSnapshot']>[1]
) => {
  const service = useFirestoreService(serviceName);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = service.onSnapshot(
      (documents) => {
        setData(documents as T[]);
        setLoading(false);
      },
      options
    );

    return unsubscribe;
  }, [service, options]);

  return { data, loading, error };
};

// Exportar tipos para uso em outros módulos
// FirebaseContextType já exportado na linha 24
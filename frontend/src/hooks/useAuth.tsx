// Hook de Autenticação - DL Auto Peças

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { usersService } from '../services/firestoreService';
import { Employee } from '../types/manager';

// ===== TIPOS =====
export interface AuthUser extends User {
  role?: 'admin' | 'manager' | 'seller' | 'announcer';
  permissions?: string[];
  employee?: Employee;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<AuthUser | null>;
  signUp: (email: string, password: string, userData: any) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<AuthUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ===== CONTEXTO =====
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===== PROVIDER =====
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados do usuário no Firestore
  const fetchUserData = async (firebaseUser: User): Promise<AuthUser> => {
    try {
      const userData = await usersService.readById(firebaseUser.uid);
      
      if (userData) {
        return {
          ...firebaseUser,
          role: userData.role || 'seller',
          permissions: userData.permissions || [],
          employee: userData.employee
        } as AuthUser;
      } else {
        // Criar documento do usuário se não existir
        const newUserData = {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: 'seller',
          permissions: ['read_products', 'create_orders']
        };
        
        await usersService.create(newUserData, firebaseUser.uid);
        
        return {
          ...firebaseUser,
          role: 'seller',
          permissions: ['read_products', 'create_orders']
        } as AuthUser;
      }
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
      return {
        ...firebaseUser,
        role: 'seller',
        permissions: []
      } as AuthUser;
    }
  };

  // Login
  const signIn = async (email: string, password: string): Promise<AuthUser | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(result.user);
      setUser(userData);
      return userData;
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cadastro
  const signUp = async (email: string, password: string, userData: any): Promise<AuthUser | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Atualizar perfil
      if (userData.displayName) {
        await updateProfile(result.user, {
          displayName: userData.displayName
        });
      }
      
      // Criar documento no Firestore
      const userDoc = {
        email: result.user.email,
        displayName: userData.displayName || '',
        role: userData.role || 'seller',
        permissions: userData.permissions || ['read_products', 'create_orders'],
        employee: userData.employee,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersService.create(userDoc, result.user.uid);
      
      const authUser = {
        ...result.user,
        role: userDoc.role,
        permissions: userDoc.permissions,
        employee: userDoc.employee
      } as AuthUser;
      
      setUser(authUser);
      return authUser;
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset de senha
  const resetPassword = async (email: string): Promise<void> => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Atualizar perfil do usuário
  const updateUserProfile = async (data: Partial<AuthUser>): Promise<void> => {
    if (!user) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    try {
      // Atualizar no Firebase Auth se necessário
      if (data.displayName) {
        await updateProfile(user, {
          displayName: data.displayName
        });
      }
      
      // Atualizar no Firestore
      await usersService.update(user.uid, data);
      
      // Atualizar estado local
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar dados do usuário
  const refreshUser = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const userData = await fetchUserData(user);
      setUser(userData);
    } catch (err) {
      console.error('Erro ao recarregar dados do usuário:', err);
    }
  };

  // Traduzir códigos de erro
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuário não encontrado';
      case 'auth/wrong-password':
        return 'Senha incorreta';
      case 'auth/email-already-in-use':
        return 'Este email já está em uso';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde';
      case 'auth/network-request-failed':
        return 'Erro de conexão. Verifique sua internet';
      default:
        return 'Erro desconhecido. Tente novamente';
    }
  };

  // Monitorar mudanças de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          const userData = await fetchUserData(firebaseUser);
          setUser(userData);
        } catch (err) {
          console.error('Erro ao carregar dados do usuário:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    logout,
    resetPassword,
    updateUserProfile,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ===== HOOK =====
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// ===== HOOK PARA VERIFICAR PERMISSÕES =====
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  };
  
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };
  
  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role || '');
  };
  
  const canAccess = (requiredPermissions: string[], requireAll = false): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    const userPermissions = user.permissions || [];
    
    if (requireAll) {
      return requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
    } else {
      return requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );
    }
  };
  
  return {
    user,
    hasPermission,
    hasRole,
    hasAnyRole,
    canAccess
  };
};

export default useAuth;
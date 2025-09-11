import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';
import { FirestoreService } from './firestoreService';
import { UserRole } from '../types/auth';

// Tipos para o serviço de autenticação Firebase
export interface FirebaseUserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  perfil: UserRole;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  empresa?: string;
  telefone?: string;
  configuracoes?: {
    tema: 'light' | 'dark';
    notificacoes: boolean;
    idioma: string;
  };
}

export interface FirebaseLoginCredentials {
  email: string;
  password: string;
}

export interface FirebaseRegisterData extends FirebaseLoginCredentials {
  displayName: string;
  perfil: UserRole;
  empresa?: string;
  telefone?: string;
}

export interface FirebaseAuthState {
  user: User | null;
  userProfile: FirebaseUserProfile | null;
  loading: boolean;
  error: string | null;
}

/**
 * Serviço de autenticação Firebase complementar ao sistema DL Auto Peças
 * Fornece funcionalidades de:
 * - Autenticação Firebase paralela ao FastAPI
 * - Sincronização de dados com Firestore
 * - Gerenciamento de perfis Firebase
 * - Integração opcional com sistema existente
 */
export class FirebaseAuthService {
  private userService: FirestoreService;
  private authStateListeners: Array<(authState: FirebaseAuthState) => void> = [];
  private currentAuthState: FirebaseAuthState = {
    user: null,
    userProfile: null,
    loading: true,
    error: null
  };

  constructor() {
    this.userService = new FirestoreService('firebase_usuarios');
    this.initializeAuthListener();
  }

  /**
   * Inicializar listener de estado de autenticação Firebase
   */
  private initializeAuthListener(): void {
    onAuthStateChanged(auth, async (user) => {
      try {
        this.currentAuthState.loading = true;
        this.currentAuthState.error = null;
        this.notifyListeners();

        if (user) {
          // Usuário logado - buscar perfil no Firestore
          const userProfile = await this.getUserProfile(user.uid);
          
          if (userProfile) {
            // Atualizar último login
            await this.updateLastLogin(user.uid);
            
            this.currentAuthState = {
              user,
              userProfile,
              loading: false,
              error: null
            };
          } else {
            // Perfil não encontrado - criar perfil básico
            const newProfile = await this.createUserProfile(user, UserRole.VENDEDOR);
            this.currentAuthState = {
              user,
              userProfile: newProfile,
              loading: false,
              error: null
            };
          }
        } else {
          // Usuário deslogado
          this.currentAuthState = {
            user: null,
            userProfile: null,
            loading: false,
            error: null
          };
        }
      } catch (error) {
        console.error('Erro no listener de autenticação Firebase:', error);
        this.currentAuthState = {
          user,
          userProfile: null,
          loading: false,
          error: `Erro ao carregar perfil Firebase: ${error}`
        };
      }

      this.notifyListeners();
    });
  }

  /**
   * Fazer login Firebase (complementar ao sistema principal)
   * @param credentials Credenciais de login
   * @returns Promise com resultado do login
   */
  async loginFirebase(credentials: FirebaseLoginCredentials): Promise<UserCredential> {
    try {
      this.currentAuthState.loading = true;
      this.currentAuthState.error = null;
      this.notifyListeners();

      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      return userCredential;
    } catch (error: unknown) {
      const errorMessage = this.getAuthErrorMessage((error as any)?.code || 'unknown');
      this.currentAuthState.error = errorMessage;
      this.currentAuthState.loading = false;
      this.notifyListeners();
      throw new Error(errorMessage);
    }
  }

  /**
   * Registrar novo usuário Firebase
   * @param registerData Dados de registro
   * @returns Promise com resultado do registro
   */
  async registerFirebase(registerData: FirebaseRegisterData): Promise<UserCredential> {
    try {
      this.currentAuthState.loading = true;
      this.currentAuthState.error = null;
      this.notifyListeners();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerData.email,
        registerData.password
      );

      // Atualizar perfil do usuário
      await updateProfile(userCredential.user, {
        displayName: registerData.displayName
      });

      // Criar perfil no Firestore
      await this.createUserProfile(userCredential.user, registerData.perfil, {
        empresa: registerData.empresa,
        telefone: registerData.telefone
      });

      return userCredential;
    } catch (error: unknown) {
      const errorMessage = this.getAuthErrorMessage((error as any)?.code || 'unknown');
      this.currentAuthState.error = errorMessage;
      this.currentAuthState.loading = false;
      this.notifyListeners();
      throw new Error(errorMessage);
    }
  }

  /**
   * Fazer logout Firebase
   * @returns Promise void
   */
  async logoutFirebase(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: unknown) {
      console.error('Erro ao fazer logout Firebase:', error);
      throw new Error('Falha ao fazer logout Firebase');
    }
  }

  /**
   * Enviar email de redefinição de senha Firebase
   * @param email Email do usuário
   * @returns Promise void
   */
  async resetPasswordFirebase(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      const errorMessage = this.getAuthErrorMessage((error as any)?.code || 'unknown');
      throw new Error(errorMessage);
    }
  }

  /**
   * Buscar perfil do usuário no Firestore
   * @param uid UID do usuário
   * @returns Promise com perfil do usuário
   */
  private async getUserProfile(uid: string): Promise<FirebaseUserProfile | null> {
    try {
      const profile = await this.userService.readById(uid);
      return profile as FirebaseUserProfile | null;
    } catch (error) {
      console.error('Erro ao buscar perfil Firebase do usuário:', error);
      return null;
    }
  }

  /**
   * Criar perfil do usuário no Firestore
   * @param user Usuário Firebase
   * @param perfil Tipo de perfil
   * @param additionalData Dados adicionais
   * @returns Promise com perfil criado
   */
  private async createUserProfile(
    user: User,
    perfil: UserRole,
    additionalData?: Partial<FirebaseUserProfile>
  ): Promise<FirebaseUserProfile> {
    try {
      const userProfile: Omit<FirebaseUserProfile, 'createdAt' | 'updatedAt'> = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        perfil,
        ativo: true,
        lastLogin: new Date(),
        configuracoes: {
          tema: 'light',
          notificacoes: true,
          idioma: 'pt-BR'
        },
        ...additionalData
      };

      await this.userService.create(userProfile, user.uid);
      
      return {
        ...userProfile,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Erro ao criar perfil Firebase do usuário:', error);
      throw new Error('Falha ao criar perfil Firebase do usuário');
    }
  }

  /**
   * Atualizar último login do usuário
   * @param uid UID do usuário
   */
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.userService.update(uid, {
        lastLogin: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar último login Firebase:', error);
    }
  }

  /**
   * Obter mensagem de erro amigável
   * @param errorCode Código do erro Firebase
   * @returns Mensagem de erro
   */
  private getAuthErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/email-already-in-use': 'Email já está em uso',
      'auth/weak-password': 'Senha muito fraca',
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Usuário desabilitado',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet'
    };

    return errorMessages[errorCode] || 'Erro de autenticação Firebase desconhecido';
  }

  /**
   * Adicionar listener para mudanças de estado
   * @param listener Função callback
   * @returns Função para remover listener
   */
  onAuthStateChange(listener: (authState: FirebaseAuthState) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Enviar estado atual imediatamente
    listener(this.currentAuthState);
    
    // Retornar função para remover listener
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notificar todos os listeners sobre mudanças de estado
   */
  private notifyListeners(): void {
    this.authStateListeners.forEach(listener => {
      listener(this.currentAuthState);
    });
  }

  /**
   * Obter estado atual de autenticação Firebase
   * @returns Estado atual
   */
  getCurrentAuthState(): FirebaseAuthState {
    return { ...this.currentAuthState };
  }

  /**
   * Verificar se usuário está autenticado no Firebase
   * @returns Boolean
   */
  isFirebaseAuthenticated(): boolean {
    return !!this.currentAuthState.user && !!this.currentAuthState.userProfile;
  }

  /**
   * Obter perfil do usuário Firebase atual
   * @returns Perfil do usuário ou null
   */
  getCurrentFirebaseUserProfile(): FirebaseUserProfile | null {
    return this.currentAuthState.userProfile;
  }

  /**
   * Sincronizar usuário Firebase com sistema principal
   * @param mainSystemUserId ID do usuário no sistema principal
   * @returns Promise void
   */
  async syncWithMainSystem(mainSystemUserId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário Firebase não autenticado');
      }

      await this.userService.update(currentUser.uid, {
        mainSystemUserId,
        syncedAt: new Date()
      });

      console.log('Usuário Firebase sincronizado com sistema principal:', {
        firebaseUid: currentUser.uid,
        mainSystemUserId
      });
    } catch (error) {
      console.error('Erro ao sincronizar com sistema principal:', error);
      throw new Error('Falha na sincronização com sistema principal');
    }
  }
}

// Instância singleton do serviço de autenticação Firebase
export const firebaseAuthService = new FirebaseAuthService();

// Exportar tipos para uso em outros módulos
// Tipos já exportados individualmente acima
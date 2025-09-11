import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Configuração do Firebase usando variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validação das variáveis de ambiente obrigatórias
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
  console.error('Variáveis de ambiente Firebase obrigatórias não encontradas:', missingVars);
  throw new Error(`Configuração Firebase incompleta. Variáveis faltando: ${missingVars.join(', ')}`);
}

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);

// Inicialização do Firestore
export const db = getFirestore(app);

// Inicialização do Firebase Auth
export const auth = getAuth(app);

// Configuração para desenvolvimento (emuladores)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    // Conectar ao emulador do Firestore se estiver em desenvolvimento
    if (!firebaseConfig.projectId?.includes('demo-')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    
    // Conectar ao emulador do Auth se estiver em desenvolvimento
    if (!firebaseConfig.apiKey?.includes('demo-')) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
  } catch (error) {
    console.warn('Erro ao conectar aos emuladores Firebase:', error);
  }
}

// Configurações do projeto
export const firebaseSettings = {
  projectId: firebaseConfig.projectId,
  isDevelopment: import.meta.env.DEV,
  useEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
};

// Log de inicialização
console.log('Firebase inicializado:', {
  projectId: firebaseConfig.projectId,
  environment: import.meta.env.DEV ? 'development' : 'production',
  emulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
});

export default app;
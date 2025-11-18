import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Inicializar Firebase apenas se as variáveis de ambiente estiverem disponíveis
// Verificar se já existe uma instância do Firebase para evitar múltiplas inicializações
let app;

try {
  const existingApps = getApps();
  
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
  }
} catch (error: any) {
  // Durante o build estático, se as variáveis não estiverem disponíveis,
  // apenas loga um aviso mas não quebra o build
  if (error?.code === 'auth/invalid-api-key' || !firebaseConfig.apiKey) {
    if (typeof window === 'undefined') {
      // Apenas no servidor durante build
      console.warn('⚠️ Firebase não inicializado durante build - variáveis de ambiente podem não estar disponíveis');
    }
  } else {
    // Outros erros devem ser propagados
    throw error;
  }
}

// Inicializar serviços apenas se o app foi criado com sucesso
// Se o app não foi inicializado, criar um app padrão para evitar erros
if (!app && typeof window !== 'undefined') {
  // No cliente, se não houver app, tentar inicializar com valores padrão ou vazios
  // Isso evita erros de "onAuthStateChanged is not a function"
  try {
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      app = initializeApp(firebaseConfig);
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
  }
}

export const database = app ? getFirestore(app) : ({} as any);
export const auth = app ? getAuth(app) : ({} as any);
export const storage = app ? getStorage(app) : ({} as any);


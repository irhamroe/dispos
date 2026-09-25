import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

// Get config from Environment Variables or LocalStorage (for UI runtime setup)
export const getFirebaseConfig = (): FirebaseConfig | null => {
  // Check localStorage override first (enables setup from Web UI directly)
  try {
    const saved = localStorage.getItem('app_firebase_custom_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse custom firebase config from localStorage', e);
  }

  // Fallback to Vite env variables
  const envConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  };

  if (envConfig.apiKey && envConfig.projectId && envConfig.apiKey !== 'YOUR_API_KEY') {
    return envConfig;
  }

  return null;
};

export const isFirebaseConfigured = (): boolean => {
  return getFirebaseConfig() !== null;
};

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export const initFirebase = (): { app: FirebaseApp | null; db: Firestore | null; auth: Auth | null } => {
  const config = getFirebaseConfig();

  if (!config) {
    return { app: null, db: null, auth: null };
  }

  try {
    if (!getApps().length) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    return { app: appInstance, db: dbInstance, auth: authInstance };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return { app: null, db: null, auth: null };
  }
};

export const getDb = (): Firestore | null => {
  if (!dbInstance) {
    const initialized = initFirebase();
    dbInstance = initialized.db;
  }
  return dbInstance;
};

export const getFirebaseAuth = (): Auth | null => {
  if (!authInstance) {
    const initialized = initFirebase();
    authInstance = initialized.auth;
  }
  return authInstance;
};

export const saveCustomFirebaseConfig = (config: FirebaseConfig) => {
  localStorage.setItem('app_firebase_custom_config', JSON.stringify(config));
  // Reinitialize
  appInstance = null;
  dbInstance = null;
  authInstance = null;
  return initFirebase();
};

export const removeCustomFirebaseConfig = () => {
  localStorage.removeItem('app_firebase_custom_config');
  appInstance = null;
  dbInstance = null;
  authInstance = null;
};

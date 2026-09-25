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

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyBIhWVw1Nqiqgq6ql4HFJGJKD3XwbGfO40",
  authDomain: "dispos-smaba.firebaseapp.com",
  projectId: "dispos-smaba",
  storageBucket: "dispos-smaba.firebasestorage.app",
  messagingSenderId: "43429773631",
  appId: "1:43429773631:web:dcea5aaa09f8b85f7ad38a",
  measurementId: "G-RDYCXBJERT"
};

// Get config from Environment Variables, LocalStorage or Default Config
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

  // Vite env variables with fallback to default project dispos-smaba
  const envConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
  };

  if (envConfig.apiKey && envConfig.projectId && envConfig.apiKey !== 'YOUR_API_KEY') {
    return envConfig;
  }

  return DEFAULT_FIREBASE_CONFIG;
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

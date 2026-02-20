import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Analytics, getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyDTu9B9sa9l6ZR-qdnvp1GhRPseq0-84XA',
  authDomain: 'joi-chat-30f52.firebaseapp.com',
  projectId: 'joi-chat-30f52',
  storageBucket: 'joi-chat-30f52.firebasestorage.app',
  messagingSenderId: '106448449027',
  appId: '1:106448449027:web:1d90a6bc5eab20922ce836',
  measurementId: 'G-VSGDVZKQ5L',
};

const hasRequiredFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(Boolean);

// Initialize Firebase only when required config exists
const app: FirebaseApp | null = hasRequiredFirebaseConfig
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0]
  : null;

export const isFirebaseConfigured = hasRequiredFirebaseConfig;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export let analytics: Analytics | null = null;
let authInstance: Auth | null = null;

let authConfigValidated = false;

export async function ensureFirebaseAuthConfigured(): Promise<void> {
  if (!hasRequiredFirebaseConfig) {
    throw new Error('Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_* environment variables.');
  }

  if (authConfigValidated) {
    return;
  }

  const url = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${firebaseConfig.apiKey}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('Unable to reach Firebase Authentication. Check your network connection.');
  }

  if (!response.ok) {
    throw new Error(
      'Firebase Authentication is not configured for this project (CONFIGURATION_NOT_FOUND). Enable Authentication in Firebase Console and verify this API key belongs to the same Firebase project.'
    );
  }

  authConfigValidated = true;
}

export function getFirebaseAuth(): Auth | null {
  if (!app) {
    return null;
  }

  if (!authInstance) {
    authInstance = getAuth(app);
  }

  return authInstance;
}

if (app && typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}

export default app;

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GithubAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';
import { ensureFirebaseAuthConfigured, getFirebaseAuth } from '@/lib/firebase';

const FIREBASE_NOT_CONFIGURED_ERROR =
  'Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_* environment variables.';

const ensureAuthReady = async () => {
  await ensureFirebaseAuthConfigured();
  const auth = getFirebaseAuth();
  if (!auth) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
  return auth;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGithub: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuthState = async () => {
      try {
        await ensureFirebaseAuthConfigured();
        const auth = getFirebaseAuth();
        if (!auth) {
          setLoading(false);
          return;
        }

        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
        });
      } catch {
        setLoading(false);
      }
    };

    initAuthState();

    return () => unsubscribe?.();
  }, []);

  const signInWithGithub = async () => {
    const auth = await ensureAuthReady();
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const auth = await ensureAuthReady();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const auth = await ensureAuthReady();
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGithub,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { useCallback } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Message, UserProfile, UserSettings } from '@/lib/types';

export function useFirebase() {
  const saveMessage = useCallback(async (userId: string, message: Message) => {
    const messagesRef = collection(db, 'users', userId, 'conversations', 'default', 'messages');
    await addDoc(messagesRef, {
      role: message.role,
      content: message.content,
      timestamp: serverTimestamp(),
      audioUrl: message.audioUrl || null,
      metadata: message.metadata || null,
    });
  }, []);

  const loadMessages = useCallback(async (userId: string): Promise<Message[]> => {
    const messagesRef = collection(db, 'users', userId, 'conversations', 'default', 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      role: doc.data().role,
      content: doc.data().content,
      timestamp: doc.data().timestamp?.toDate() || new Date(),
      audioUrl: doc.data().audioUrl,
      metadata: doc.data().metadata,
    }));
  }, []);

  const subscribeToMessages = useCallback(
    (userId: string, onUpdate: (messages: Message[]) => void): Unsubscribe => {
      const messagesRef = collection(db, 'users', userId, 'conversations', 'default', 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));

      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          role: doc.data().role,
          content: doc.data().content,
          timestamp: doc.data().timestamp?.toDate() || new Date(),
          audioUrl: doc.data().audioUrl,
          metadata: doc.data().metadata,
        }));
        onUpdate(messages);
      });
    },
    []
  );

  const saveUserProfile = useCallback(async (profile: UserProfile) => {
    const userRef = doc(db, 'users', profile.uid);
    await setDoc(
      userRef,
      {
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        settings: profile.settings,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }, []);

  const updateUserSettings = useCallback(async (userId: string, settings: Partial<UserSettings>) => {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { settings }, { merge: true });
  }, []);

  return {
    saveMessage,
    loadMessages,
    subscribeToMessages,
    saveUserProfile,
    updateUserSettings,
  };
}

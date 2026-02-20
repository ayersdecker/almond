import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChatInterface } from '@/components/ChatInterface';
import { useAuth } from '@/contexts/AuthContext';
import { useConversation } from '@/contexts/ConversationContext';
import { useClawdbot } from '@/hooks/useClawdbot';
import { useFirebase } from '@/hooks/useFirebase';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { Message } from '@/lib/types';

export default function ChatScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const { messages, addMessage, setLoading, isLoading } = useConversation();
  const { sendMsg } = useClawdbot();
  const { subscribeToMessages } = useFirebase();
  const { speak } = useTextToSpeech();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated]);

  // Subscribe to Firestore for real-time sync; messages are merged into local context state
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMessages(user.uid, (firestoreMessages) => {
      // Sync any messages added from other devices by adding ones not yet in local state
      firestoreMessages.forEach((msg) => addMessage(msg));
    });
    return unsubscribe;
  }, [user, subscribeToMessages, addMessage]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      addMessage(userMessage);
      setLoading(true);

      try {
        const token = await user?.getIdToken();
        const response = await sendMsg(content, token);

        if (response) {
          const aiMessage: Message = {
            id: response.messageId,
            role: 'assistant',
            content: response.content,
            timestamp: response.timestamp,
          };
          addMessage(aiMessage);
          // Auto-play TTS for AI response
          speak(response.content);
        }
      } catch (error) {
        addMessage({
          id: Date.now().toString() + '-error',
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        });
      } finally {
        setLoading(false);
      }
    },
    [user, addMessage, setLoading, sendMsg, speak]
  );

  if (loading) return null;

  return (
    <View style={styles.container}>
      <ChatInterface
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});

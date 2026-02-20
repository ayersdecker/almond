import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Message } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { VoiceButton } from './VoiceButton';
import { Transcript } from './Transcript';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => Promise<void>;
}

export function ChatInterface({ messages, isLoading, onSendMessage }: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { transcript, interimTranscript, isListening, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();
  const { speak, stop: stopSpeaking } = useTextToSpeech();

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim() || transcript.trim();
    if (!text || isLoading) return;

    setInputText('');
    resetTranscript();
    await onSendMessage(text);
  }, [inputText, transcript, isLoading, resetTranscript, onSendMessage]);

  const handleVoicePressIn = useCallback(() => {
    stopSpeaking();
    startListening();
  }, [stopSpeaking, startListening]);

  const handleVoicePressOut = useCallback(() => {
    stopListening();
    if (transcript.trim()) {
      handleSend();
    }
  }, [stopListening, transcript, handleSend]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            onPlayAudio={(url) => speak(item.content)}
          />
        )}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>👋 Hi! I'm Joi, your AI companion.</Text>
            <Text style={styles.emptySubtext}>Tap the mic or type to start talking.</Text>
          </View>
        }
      />

      {isLoading && (
        <View style={styles.thinkingIndicator}>
          <Text style={styles.thinkingText}>Joi is thinking...</Text>
        </View>
      )}

      <Transcript
        transcript={transcript}
        interimTranscript={interimTranscript}
        isListening={isListening}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message Joi..."
          placeholderTextColor="#64748b"
          multiline
          maxLength={2000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          accessibilityLabel="Message input"
        />
        <VoiceButton
          isListening={isListening}
          isSupported={isSupported}
          onPressIn={handleVoicePressIn}
          onPressOut={handleVoicePressOut}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, (!inputText.trim() && !transcript.trim()) && styles.sendButtonDisabled]}
          disabled={!inputText.trim() && !transcript.trim()}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  messageList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 8,
  },
  emptyText: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 14,
  },
  thinkingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  thinkingText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#f1f5f9',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1e293b',
    opacity: 0.5,
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: 16,
  },
});

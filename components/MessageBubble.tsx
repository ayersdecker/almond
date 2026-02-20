import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
  onPlayAudio?: (audioUrl: string) => void;
}

export function MessageBubble({ message, onPlayAudio }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>J</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={styles.messageText}>{message.content}</Text>
        {message.audioUrl && !isUser && (
          <View style={styles.audioControls}>
            <Text
              style={styles.playButton}
              onPress={() => onPlayAudio?.(message.audioUrl!)}
              accessibilityLabel="Play audio response"
              accessibilityRole="button"
            >
              ▶ Play
            </Text>
          </View>
        )}
        <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#4f46e5',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#f1f5f9',
    fontSize: 15,
    lineHeight: 22,
  },
  audioControls: {
    marginTop: 8,
    flexDirection: 'row',
  },
  playButton: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  timestamp: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TranscriptProps {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
}

export function Transcript({ transcript, interimTranscript, isListening }: TranscriptProps) {
  if (!isListening && !transcript && !interimTranscript) {
    return null;
  }

  return (
    <View style={styles.container}>
      {isListening && (
        <View style={styles.listeningIndicator}>
          <Text style={styles.listeningDot}>●</Text>
          <Text style={styles.listeningText}>Listening...</Text>
        </View>
      )}
      {(transcript || interimTranscript) && (
        <Text style={styles.transcriptText}>
          {transcript}
          {interimTranscript && (
            <Text style={styles.interimText}>{interimTranscript}</Text>
          )}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#06b6d4',
    gap: 4,
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listeningDot: {
    color: '#ef4444',
    fontSize: 10,
  },
  listeningText: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '600',
  },
  transcriptText: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
  },
  interimText: {
    color: '#64748b',
  },
});

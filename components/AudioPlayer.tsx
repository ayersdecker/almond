import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AudioPlayerProps {
  audioUrl: string;
  isSpeaking: boolean;
  isPaused: boolean;
  progress: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSetSpeed: (speed: number) => void;
}

export function AudioPlayer({
  isSpeaking,
  isPaused,
  progress,
  speed,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSetSpeed,
}: AudioPlayerProps) {
  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        {!isSpeaking ? (
          <TouchableOpacity
            onPress={onPlay}
            style={styles.button}
            accessibilityLabel="Play audio"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>▶</Text>
          </TouchableOpacity>
        ) : isPaused ? (
          <TouchableOpacity
            onPress={onResume}
            style={styles.button}
            accessibilityLabel="Resume audio"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>▶</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              onPress={onPause}
              style={styles.button}
              accessibilityLabel="Pause audio"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>⏸</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onStop}
              style={styles.button}
              accessibilityLabel="Stop audio"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>⏹</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.speedControls}>
        {speeds.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => onSetSpeed(s)}
            style={[styles.speedButton, speed === s && styles.speedButtonActive]}
            accessibilityLabel={`Set speed to ${s}x`}
            accessibilityRole="button"
          >
            <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>
              {s}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  speedControls: {
    flexDirection: 'row',
    gap: 6,
  },
  speedButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  speedButtonActive: {
    backgroundColor: '#3b82f6',
  },
  speedText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  speedTextActive: {
    color: '#ffffff',
  },
});

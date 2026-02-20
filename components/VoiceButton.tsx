import React, { useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated, Platform } from 'react-native';

interface VoiceButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function VoiceButton({ isListening, isSupported, onPressIn, onPressOut }: VoiceButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const buttonShadowStyle =
    Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(59, 130, 246, 0.4)' }
      : {
          shadowColor: '#3b82f6',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 4,
        };
  const buttonActiveShadowStyle =
    Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(6, 182, 212, 0.4)' }
      : { shadowColor: '#06b6d4' };

  React.useEffect(() => {
    if (isListening) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      loopRef.current = null;
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  if (!isSupported) {
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedText}>Voice not supported</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.pulseWrapper, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.button,
          buttonShadowStyle,
          isListening && styles.buttonActive,
          isListening && buttonActiveShadowStyle,
        ]}
        activeOpacity={0.8}
        accessibilityLabel={isListening ? 'Stop recording' : 'Hold to record'}
        accessibilityRole="button"
        accessibilityState={{ selected: isListening }}
      >
        <Text style={styles.icon}>{isListening ? '🔴' : '🎤'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pulseWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#06b6d4',
  },
  icon: {
    fontSize: 24,
  },
  unsupportedContainer: {
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  unsupportedText: {
    color: '#64748b',
    fontSize: 12,
  },
});

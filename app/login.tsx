import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getAuthErrorMessage = (error: unknown, fallbackMessage: string) => {
    const message = error instanceof Error ? error.message : '';

    if (
      message.includes('CONFIGURATION_NOT_FOUND') ||
      message.includes('auth/configuration-not-found')
    ) {
      return 'Firebase Authentication is not configured for this project. Enable Auth in Firebase Console and verify API key restrictions.';
    }

    if (message.includes('auth/invalid-api-key')) {
      return 'Firebase API key is invalid for this project. Check your Firebase web app configuration.';
    }

    if (message.includes('auth/operation-not-allowed')) {
      return 'This sign-in method is not enabled in Firebase Authentication settings.';
    }

    return fallbackMessage;
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Sign In Error', getAuthErrorMessage(error, 'Failed to sign in with Google'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Auth Error',
        getAuthErrorMessage(
          error,
          isSignUp ? 'Failed to create account' : 'Invalid email or password'
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🤖</Text>
        <Text style={styles.title}>Joi</Text>
        <Text style={styles.subtitle}>Your AI Voice Companion</Text>
      </View>

      <View style={styles.form}>
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          style={styles.githubButton}
          disabled={isLoading}
          accessibilityLabel="Sign in with Google"
          accessibilityRole="button"
        >
          <Text style={styles.githubButtonText}>⊛ Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email input"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#64748b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password input"
        />

        <TouchableOpacity
          onPress={handleEmailAuth}
          style={styles.emailButton}
          disabled={isLoading}
          accessibilityLabel={isSignUp ? 'Create account' : 'Sign in'}
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.emailButtonText}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsSignUp(!isSignUp)}
          accessibilityRole="button"
        >
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    gap: 8,
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  form: {
    gap: 12,
  },
  githubButton: {
    backgroundColor: '#24292f',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  githubButtonText: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e293b',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#f1f5f9',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emailButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  emailButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    color: '#3b82f6',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 4,
  },
});

import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useConversation } from '@/contexts/ConversationContext';
import { useClawdbot } from '@/hooks/useClawdbot';
import { StatusCard } from '@/components/StatusCard';
import { MemoryViewer } from '@/components/MemoryViewer';

export default function StatusScreen() {
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const { messages, clearMessages } = useConversation();
  const { sessionStatus, memoryFiles, isLoading, error, fetchStatus, fetchMemoryFiles } = useClawdbot();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const token = await user.getIdToken();
        fetchStatus(token);
        fetchMemoryFiles(token);
      };
      fetchData();
    }
  }, [user, fetchStatus, fetchMemoryFiles]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleExportChat = () => {
    const chatLog = messages
      .map((m) => `[${m.timestamp.toISOString()}] ${m.role}: ${m.content}`)
      .join('\n');
    // On web, trigger download
    if (typeof window !== 'undefined') {
      const blob = new Blob([chatLog], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `joi-chat-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
    }
  };

  if (loading) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.userSection}>
        <Text style={styles.userName}>
          {user?.displayName || user?.email || 'User'}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <StatusCard status={sessionStatus} isLoading={isLoading} error={error} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={clearMessages}
            style={styles.actionButton}
            accessibilityLabel="Clear conversation history"
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>🗑 Clear Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExportChat}
            style={styles.actionButton}
            accessibilityLabel="Export chat log"
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>📥 Export Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSignOut}
            style={[styles.actionButton, styles.signOutButton]}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
          >
            <Text style={[styles.actionText, styles.signOutText]}>🚪 Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <MemoryViewer
        files={memoryFiles}
        isLoading={isLoading}
        onRefresh={async () => {
          if (user) {
            const token = await user.getIdToken();
            fetchMemoryFiles(token);
          }
        }}
      />

      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {messages.slice(-10).reverse().map((msg) => (
          <View key={msg.id} style={styles.activityItem}>
            <Text style={styles.activityRole}>{msg.role === 'user' ? '👤' : '🤖'}</Text>
            <Text style={styles.activityContent} numberOfLines={2}>
              {msg.content}
            </Text>
            <Text style={styles.activityTime}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        {messages.length === 0 && (
          <Text style={styles.emptyText}>No activity yet</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  userName: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '600',
  },
  userEmail: {
    color: '#64748b',
    fontSize: 14,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  signOutText: {
    color: '#ef4444',
  },
  activitySection: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  activityRole: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  activityTime: {
    color: '#64748b',
    fontSize: 11,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
    padding: 16,
  },
});

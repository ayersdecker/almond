import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SessionStatus } from '@/lib/types';

interface StatusCardProps {
  status: SessionStatus | null;
  isLoading: boolean;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export function StatusCard({ status, isLoading }: StatusCardProps) {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>Loading status...</Text>
      </View>
    );
  }

  if (!status) {
    return (
      <View style={styles.card}>
        <Text style={styles.offlineText}>Backend offline</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>System Status</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Model</Text>
        <Text style={styles.value}>{status.model}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Uptime</Text>
        <Text style={styles.value}>{formatUptime(status.uptime)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Tokens Used</Text>
        <Text style={styles.value}>{status.tokensUsed.toLocaleString()}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Avg Response</Text>
        <Text style={styles.value}>{status.responseTime}ms</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#64748b',
    fontSize: 14,
  },
  value: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
  },
  offlineText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MemoryFile } from '@/lib/types';

interface MemoryViewerProps {
  files: MemoryFile[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function MemoryViewer({ files, isLoading, onRefresh }: MemoryViewerProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memory Files</Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshButton}
          accessibilityLabel="Refresh memory files"
          accessibilityRole="button"
        >
          <Text style={styles.refreshText}>{isLoading ? '⟳' : '↻'}</Text>
        </TouchableOpacity>
      </View>

      {files.length === 0 && !isLoading ? (
        <Text style={styles.emptyText}>No memory files available</Text>
      ) : (
        files.map((file) => (
          <View key={file.path} style={styles.fileCard}>
            <TouchableOpacity
              onPress={() =>
                setExpandedFile(expandedFile === file.path ? null : file.path)
              }
              style={styles.fileHeader}
              accessibilityLabel={`Toggle ${file.path}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: expandedFile === file.path }}
            >
              <Text style={styles.fileName}>{file.path.split('/').pop()}</Text>
              <Text style={styles.fileDate}>{formatDate(file.lastModified)}</Text>
              <Text style={styles.expandIcon}>
                {expandedFile === file.path ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {expandedFile === file.path && (
              <ScrollView style={styles.fileContent} nestedScrollEnabled>
                <Text style={styles.fileText}>{file.content}</Text>
              </ScrollView>
            )}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    color: '#3b82f6',
    fontSize: 18,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
    padding: 16,
  },
  fileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    overflow: 'hidden',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  fileName: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  fileDate: {
    color: '#64748b',
    fontSize: 12,
  },
  expandIcon: {
    color: '#64748b',
    fontSize: 12,
  },
  fileContent: {
    maxHeight: 300,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  fileText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontFamily: 'monospace',
    padding: 12,
    lineHeight: 20,
  },
});

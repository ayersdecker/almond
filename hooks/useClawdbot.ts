import { useState, useCallback } from 'react';
import { sendMessage, getMemoryFiles, getSessionStatus } from '@/lib/clawdbot';
import { MemoryFile, SessionStatus, ClawdbotResponse } from '@/lib/types';

interface ClawdbotHook {
  sendMsg: (content: string, token?: string) => Promise<ClawdbotResponse | null>;
  fetchMemoryFiles: (token?: string) => Promise<void>;
  fetchStatus: (token?: string) => Promise<void>;
  memoryFiles: MemoryFile[];
  sessionStatus: SessionStatus | null;
  isLoading: boolean;
  error: string | null;
}

export function useClawdbot(): ClawdbotHook {
  const [memoryFiles, setMemoryFiles] = useState<MemoryFile[]>([]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMsg = useCallback(async (content: string, token?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await sendMessage(content, token);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMemoryFiles = useCallback(async (token?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const files = await getMemoryFiles(token);
      setMemoryFiles(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch memory files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async (token?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const status = await getSessionStatus(token);
      setSessionStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendMsg,
    fetchMemoryFiles,
    fetchStatus,
    memoryFiles,
    sessionStatus,
    isLoading,
    error,
  };
}

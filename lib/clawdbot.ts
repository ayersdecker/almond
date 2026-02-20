import { ClawdbotResponse, MemoryFile, SessionStatus } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_CLAWDBOT_URL || '';

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Clawdbot API error: ${response.status} ${response.statusText}`);
  }

  return response;
}

export async function sendMessage(
  content: string,
  token?: string
): Promise<ClawdbotResponse> {
  const response = await fetchWithAuth(
    '/api/message',
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    },
    token
  );

  const data = await response.json();
  return {
    messageId: data.message_id || data.id,
    content: data.content || data.response,
    timestamp: new Date(data.timestamp || Date.now()),
  };
}

export async function getMemoryFiles(token?: string): Promise<MemoryFile[]> {
  const response = await fetchWithAuth('/api/memory', {}, token);
  const data = await response.json();

  return (data.files || []).map((file: { path: string; content: string; last_modified?: string; lastModified?: string }) => ({
    path: file.path,
    content: file.content,
    lastModified: new Date(file.last_modified || file.lastModified || Date.now()),
  }));
}

export async function getSessionStatus(token?: string): Promise<SessionStatus> {
  const response = await fetchWithAuth('/api/status', {}, token);
  const data = await response.json();

  return {
    model: data.model || 'unknown',
    uptime: data.uptime || 0,
    tokensUsed: data.tokens_used || data.tokensUsed || 0,
    responseTime: data.response_time || data.responseTime || 0,
    sessionKey: data.session_key || data.sessionKey || '',
  };
}

export async function streamMessage(
  content: string,
  onChunk: (chunk: string) => void,
  token?: string
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/message/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`Stream error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            onChunk(parsed.content || parsed.delta || '');
          } catch {
            // Skip malformed chunks
          }
        }
      }
    }
  }
}

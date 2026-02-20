export type UserRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: UserRole;
  content: string;
  timestamp: Date;
  audioUrl?: string;
  audioDuration?: number;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  voiceId: string;
  voiceSpeed: number;
  autoPlay: boolean;
  theme: 'dark' | 'light';
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  settings: UserSettings;
}

export interface Session {
  sessionKey: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  tokensUsed: number;
}

export interface MemoryFile {
  path: string;
  content: string;
  lastModified: Date;
}

export interface SessionStatus {
  model: string;
  uptime: number;
  tokensUsed: number;
  responseTime: number;
  sessionKey: string;
}

export interface ClawdbotResponse {
  messageId: string;
  content: string;
  timestamp: Date;
}

export interface VoiceConfig {
  voiceId: string;
  stability: number;
  similarityBoost: number;
  modelId: string;
}

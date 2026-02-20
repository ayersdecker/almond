import { VoiceConfig } from './types';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';
const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
  stability: 0.5,
  similarityBoost: 0.75,
  modelId: 'eleven_turbo_v2',
};

// Audio cache to avoid re-fetching same text
const audioCache = new Map<string, string>();

export async function synthesizeSpeech(
  text: string,
  config: Partial<VoiceConfig> = {}
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  const voiceConfig = { ...DEFAULT_VOICE_CONFIG, ...config };
  const cacheKey = `${text}-${voiceConfig.voiceId}`;

  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${voiceConfig.voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: voiceConfig.modelId,
        voice_settings: {
          stability: voiceConfig.stability,
          similarity_boost: voiceConfig.similarityBoost,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const blob = await response.blob();
  const audioUrl = URL.createObjectURL(blob);
  audioCache.set(cacheKey, audioUrl);
  return audioUrl;
}

export async function getVoices(): Promise<Array<{ voice_id: string; name: string }>> {
  const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
    headers: { 'xi-api-key': apiKey },
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const data = await response.json();
  return data.voices;
}

export const PRESET_VOICES = {
  BELLA: 'EXAVITQu4vr4xnSDxMaL',
  RACHEL: '21m00Tcm4TlvDq8ikWAM',
};

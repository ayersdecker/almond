import { useState, useRef, useCallback } from 'react';
import { synthesizeSpeech } from '@/lib/elevenlabs';
import { VoiceConfig } from '@/lib/types';

interface TextToSpeechHook {
  isSpeaking: boolean;
  isPaused: boolean;
  progress: number;
  speed: number;
  speak: (text: string, config?: Partial<VoiceConfig>) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setSpeed: (speed: number) => void;
  error: string | null;
}

export function useTextToSpeech(): TextToSpeechHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Array<{ text: string; config?: Partial<VoiceConfig> }>>([]);

  const playNext = useCallback(async () => {
    if (queueRef.current.length === 0) {
      setIsSpeaking(false);
      setProgress(0);
      return;
    }

    const next = queueRef.current.shift()!;
    try {
      const audioUrl = await synthesizeSpeech(next.text, next.config);
      const audio = new Audio(audioUrl);
      audio.playbackRate = speed;
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress(audio.currentTime / audio.duration);
        }
      };

      audio.onended = () => {
        setProgress(1);
        playNext();
      };

      audio.onerror = () => {
        setError('Audio playback failed');
        playNext();
      };

      setIsSpeaking(true);
      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TTS failed');
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(next.text);
        utterance.rate = speed;
        utterance.onend = () => playNext();
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [speed]);

  const speak = useCallback(
    async (text: string, config?: Partial<VoiceConfig>) => {
      queueRef.current.push({ text, config });
      if (!isSpeaking) {
        await playNext();
      }
    },
    [isSpeaking, playNext]
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    queueRef.current = [];
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
    }
  }, []);

  const handleSetSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  }, []);

  return {
    isSpeaking,
    isPaused,
    progress,
    speed,
    speak,
    stop,
    pause,
    resume,
    setSpeed: handleSetSpeed,
    error,
  };
}

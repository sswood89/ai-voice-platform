/**
 * Voice Types
 * Types for ElevenLabs TTS and voice cloning
 */

export interface Voice {
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
  labels?: Record<string, string>;
  isCloned: boolean;
  isDefault: boolean;
}

export interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface VoiceCloneRequest {
  name: string;
  description?: string;
  files: File[];
  labels?: Record<string, string>;
}

export interface VoiceCloneResponse {
  voiceId: string;
  name: string;
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  voiceSettings?: VoiceSettings;
  modelId?: string;
}

export interface TTSResponse {
  audio: ArrayBuffer;
  contentType: string;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
  labels?: Record<string, string>;
  settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface ElevenLabsVoicesResponse {
  voices: ElevenLabsVoice[];
}

export interface AudioCacheEntry {
  audio: ArrayBuffer;
  timestamp: number;
  voiceId: string;
  text: string;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0,
  useSpeakerBoost: true,
};

export const TTS_MODELS = {
  MULTILINGUAL_V2: 'eleven_multilingual_v2',
  TURBO_V2: 'eleven_turbo_v2',
  MONOLINGUAL_V1: 'eleven_monolingual_v1',
} as const;

export type TTSModel = typeof TTS_MODELS[keyof typeof TTS_MODELS];

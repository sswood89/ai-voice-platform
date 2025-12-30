/**
 * TTS Engine
 * ElevenLabs Text-to-Speech integration with caching
 * Ported from MindFlow SDK with enhancements for voice cloning
 */

import type {
  TTSRequest,
  VoiceSettings,
  AudioCacheEntry,
  TTSModel,
} from '@/types';
import { DEFAULT_VOICE_SETTINGS, TTS_MODELS } from '@/types';

export interface TTSEngineConfig {
  apiKey?: string;
  defaultModel?: TTSModel;
  cacheDuration?: number;
  maxCacheSize?: number;
}

export const DEFAULT_VOICES: Record<string, string> = {
  rachel: '21m00Tcm4TlvDq8ikWAM',
  drew: '29vD33N1CtxCmqQRPOHJ',
  clyde: '2EiwWnXFnvU5JabPnv8n',
  sarah: 'EXAVITQu4vr4xnSDxMaL',
};

export class TTSEngine {
  private apiKey: string | null;
  private defaultModel: TTSModel;
  private cache: Map<string, AudioCacheEntry>;
  private readonly cacheDuration: number;
  private readonly maxCacheSize: number;

  constructor(config: TTSEngineConfig = {}) {
    this.apiKey = config.apiKey ?? null;
    this.defaultModel = config.defaultModel ?? TTS_MODELS.MULTILINGUAL_V2;
    this.cacheDuration = config.cacheDuration ?? 1000 * 60 * 60 * 24; // 24 hours
    this.maxCacheSize = config.maxCacheSize ?? 100;
    this.cache = new Map();
  }

  /**
   * Initialize the engine with API key
   */
  initialize(apiKey: string | null): void {
    this.apiKey = apiKey;
  }

  /**
   * Check if the engine is properly configured
   */
  isAvailable(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  /**
   * Get the API key for server-side requests
   */
  getApiKey(): string | null {
    return this.apiKey;
  }

  /**
   * Set the default TTS model
   */
  setDefaultModel(model: TTSModel): void {
    this.defaultModel = model;
  }

  private getCacheKey(text: string, voiceId: string): string {
    const textHash = this.simpleHash(text);
    return `${voiceId}_${textHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private cleanCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.cacheDuration) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));

    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  private getCachedAudio(cacheKey: string): ArrayBuffer | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheDuration) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.audio;
  }

  private cacheAudio(cacheKey: string, audio: ArrayBuffer, voiceId: string, text: string): void {
    this.cleanCache();
    this.cache.set(cacheKey, {
      audio,
      timestamp: Date.now(),
      voiceId,
      text,
    });
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(request: TTSRequest): Promise<ArrayBuffer> {
    if (!this.isAvailable()) {
      throw new Error('TTS API key not configured');
    }

    const {
      text,
      voiceId,
      modelId = this.defaultModel,
      voiceSettings = DEFAULT_VOICE_SETTINGS,
    } = request;

    const cacheKey = this.getCacheKey(text, voiceId);
    const cachedAudio = this.getCachedAudio(cacheKey);

    if (cachedAudio) {
      return cachedAudio;
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey!,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarityBoost,
            style: voiceSettings.style ?? 0,
            use_speaker_boost: voiceSettings.useSpeakerBoost ?? true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS API error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    this.cacheAudio(cacheKey, audioBuffer, voiceId, text);

    return audioBuffer;
  }

  /**
   * Generate speech with streaming support
   */
  async generateSpeechStream(request: TTSRequest): Promise<ReadableStream<Uint8Array>> {
    if (!this.isAvailable()) {
      throw new Error('TTS API key not configured');
    }

    const {
      text,
      voiceId,
      modelId = this.defaultModel,
      voiceSettings = DEFAULT_VOICE_SETTINGS,
    } = request;

    const cacheKey = this.getCacheKey(text, voiceId);
    const cachedAudio = this.getCachedAudio(cacheKey);

    if (cachedAudio) {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(cachedAudio));
          controller.close();
        },
      });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey!,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarityBoost,
            style: voiceSettings.style ?? 0,
            use_speaker_boost: voiceSettings.useSpeakerBoost ?? true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body available');
    }

    const chunks: Uint8Array[] = [];
    const self = this;

    return new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            controller.enqueue(value);
          }
        } finally {
          reader.releaseLock();
          controller.close();

          if (chunks.length > 0) {
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const audioBuffer = new ArrayBuffer(totalLength);
            const audioArray = new Uint8Array(audioBuffer);
            let offset = 0;
            for (const chunk of chunks) {
              audioArray.set(chunk, offset);
              offset += chunk.length;
            }
            self.cacheAudio(cacheKey, audioBuffer, voiceId, text);
          }
        }
      },
    });
  }

  /**
   * Clear all cached audio
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; cacheDuration: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      cacheDuration: this.cacheDuration,
    };
  }
}

// Singleton instance
let ttsInstance: TTSEngine | null = null;

export function getTTSEngine(): TTSEngine {
  if (!ttsInstance) {
    ttsInstance = new TTSEngine();
  }
  return ttsInstance;
}

export function initializeTTS(apiKey: string | null): void {
  const engine = getTTSEngine();
  engine.initialize(apiKey);
}

export function createTTSEngine(config: TTSEngineConfig): TTSEngine {
  return new TTSEngine(config);
}

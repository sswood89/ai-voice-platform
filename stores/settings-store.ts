/**
 * Settings Store
 * User preferences and configuration
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LLMProviderType, ChatSettings } from '@/types';
import { DEFAULT_CHAT_SETTINGS } from '@/types';

interface SettingsState {
  // LLM settings
  provider: LLMProviderType;
  model: string;
  temperature: number;
  maxTokens: number;

  // Voice settings
  voiceEnabled: boolean;
  autoPlayResponses: boolean;
  defaultVoiceId: string | null;

  // API keys (stored in memory only for security)
  apiKeys: {
    elevenlabs?: string;
    anthropic?: string;
    openai?: string;
  };

  // UI preferences
  theme: 'light' | 'dark' | 'system';
  defaultPersonaId: string | null;

  // Actions
  setProvider: (provider: LLMProviderType) => void;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setAutoPlayResponses: (autoPlay: boolean) => void;
  setDefaultVoiceId: (voiceId: string | null) => void;
  setApiKey: (provider: 'elevenlabs' | 'anthropic' | 'openai', key: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDefaultPersonaId: (personaId: string | null) => void;
  getChatSettings: () => ChatSettings;
  reset: () => void;
}

const initialState = {
  provider: DEFAULT_CHAT_SETTINGS.provider,
  model: DEFAULT_CHAT_SETTINGS.model,
  temperature: DEFAULT_CHAT_SETTINGS.temperature,
  maxTokens: DEFAULT_CHAT_SETTINGS.maxTokens,
  voiceEnabled: DEFAULT_CHAT_SETTINGS.voiceEnabled,
  autoPlayResponses: DEFAULT_CHAT_SETTINGS.autoPlayResponses,
  defaultVoiceId: null,
  apiKeys: {},
  theme: 'system' as const,
  defaultPersonaId: null,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProvider: (provider) => set({ provider }),

      setModel: (model) => set({ model }),

      setTemperature: (temperature) =>
        set({ temperature: Math.max(0, Math.min(2, temperature)) }),

      setMaxTokens: (maxTokens) =>
        set({ maxTokens: Math.max(1, Math.min(100000, maxTokens)) }),

      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),

      setAutoPlayResponses: (autoPlayResponses) => set({ autoPlayResponses }),

      setDefaultVoiceId: (defaultVoiceId) => set({ defaultVoiceId }),

      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),

      setTheme: (theme) => set({ theme }),

      setDefaultPersonaId: (defaultPersonaId) => set({ defaultPersonaId }),

      getChatSettings: () => {
        const state = get();
        return {
          provider: state.provider,
          model: state.model,
          temperature: state.temperature,
          maxTokens: state.maxTokens,
          voiceEnabled: state.voiceEnabled,
          autoPlayResponses: state.autoPlayResponses,
        };
      },

      reset: () => set(initialState),
    }),
    {
      name: 'ai-voice-platform-settings',
      // Don't persist API keys
      partialize: (state) => ({
        provider: state.provider,
        model: state.model,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
        voiceEnabled: state.voiceEnabled,
        autoPlayResponses: state.autoPlayResponses,
        defaultVoiceId: state.defaultVoiceId,
        theme: state.theme,
        defaultPersonaId: state.defaultPersonaId,
      }),
    }
  )
);

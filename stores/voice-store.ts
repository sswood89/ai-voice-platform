/**
 * Voice Store
 * Manages available voices and voice cloning state
 */

import { create } from 'zustand';
import type { Voice } from '@/types';

interface VoiceState {
  voices: Voice[];
  clonedVoices: Voice[];
  isLoading: boolean;
  error: string | null;

  // Audio playback
  currentlyPlaying: string | null;
  audioElement: HTMLAudioElement | null;

  // Actions
  setVoices: (voices: Voice[]) => void;
  setClonedVoices: (voices: Voice[]) => void;
  addClonedVoice: (voice: Voice) => void;
  removeClonedVoice: (voiceId: string) => void;
  getAllVoices: () => Voice[];
  getVoice: (voiceId: string) => Voice | undefined;

  // Audio playback
  playPreview: (voiceId: string, previewUrl: string) => void;
  stopPreview: () => void;

  // Loading/error state
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  voices: [],
  clonedVoices: [],
  isLoading: false,
  error: null,
  currentlyPlaying: null,
  audioElement: null,

  setVoices: (voices) => set({ voices }),

  setClonedVoices: (clonedVoices) => set({ clonedVoices }),

  addClonedVoice: (voice) =>
    set((state) => ({
      clonedVoices: [...state.clonedVoices, voice],
    })),

  removeClonedVoice: (voiceId) =>
    set((state) => ({
      clonedVoices: state.clonedVoices.filter((v) => v.id !== voiceId),
    })),

  getAllVoices: () => {
    const { voices, clonedVoices } = get();
    return [...voices, ...clonedVoices];
  },

  getVoice: (voiceId) => {
    const { voices, clonedVoices } = get();
    return voices.find((v) => v.id === voiceId) ||
           clonedVoices.find((v) => v.id === voiceId);
  },

  playPreview: (voiceId, previewUrl) => {
    const { audioElement, currentlyPlaying, stopPreview } = get();

    // Stop current playback if any
    if (audioElement) {
      stopPreview();
    }

    // If clicking on the same voice, just stop
    if (currentlyPlaying === voiceId) {
      return;
    }

    // Create and play new audio
    const audio = new Audio(previewUrl);
    audio.onended = () => {
      set({ currentlyPlaying: null, audioElement: null });
    };
    audio.onerror = () => {
      set({ currentlyPlaying: null, audioElement: null, error: 'Failed to play audio preview' });
    };

    audio.play().catch((error) => {
      set({ error: `Failed to play audio: ${error.message}` });
    });

    set({ currentlyPlaying: voiceId, audioElement: audio });
  },

  stopPreview: () => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    set({ currentlyPlaying: null, audioElement: null });
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));

/**
 * Persona Store
 * Manages persona library and active persona
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Persona, CreatePersonaInput, UpdatePersonaInput } from '@/types';
import { PERSONA_TEMPLATES } from '@/lib/persona';

interface PersonaState {
  personas: Persona[];
  activePersonaId: string | null;
  isLoading: boolean;
  error: string | null;

  // Getters
  getPersona: (id: string) => Persona | undefined;
  getActivePersona: () => Persona | undefined;

  // Actions
  setPersonas: (personas: Persona[]) => void;
  setActivePersona: (id: string | null) => void;
  createPersona: (input: CreatePersonaInput) => Persona;
  updatePersona: (input: UpdatePersonaInput) => void;
  deletePersona: (id: string) => void;
  duplicatePersona: (id: string) => Persona | undefined;
  createFromTemplate: (templateId: string) => Persona | undefined;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set, get) => ({
      personas: [],
      activePersonaId: null,
      isLoading: false,
      error: null,

      getPersona: (id) => {
        return get().personas.find((p) => p.id === id);
      },

      getActivePersona: () => {
        const { personas, activePersonaId } = get();
        if (!activePersonaId) return undefined;
        return personas.find((p) => p.id === activePersonaId);
      },

      setPersonas: (personas) => set({ personas }),

      setActivePersona: (activePersonaId) => set({ activePersonaId }),

      createPersona: (input) => {
        const now = new Date();
        const persona: Persona = {
          ...input,
          id: generateId(),
          isTemplate: input.isTemplate ?? false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          personas: [...state.personas, persona],
        }));

        return persona;
      },

      updatePersona: (input) => {
        set((state) => ({
          personas: state.personas.map((p) =>
            p.id === input.id
              ? { ...p, ...input, updatedAt: new Date() }
              : p
          ),
        }));
      },

      deletePersona: (id) => {
        set((state) => ({
          personas: state.personas.filter((p) => p.id !== id),
          activePersonaId:
            state.activePersonaId === id ? null : state.activePersonaId,
        }));
      },

      duplicatePersona: (id) => {
        const original = get().getPersona(id);
        if (!original) return undefined;

        const now = new Date();
        const duplicate: Persona = {
          ...original,
          id: generateId(),
          name: `${original.name} (Copy)`,
          isTemplate: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          personas: [...state.personas, duplicate],
        }));

        return duplicate;
      },

      createFromTemplate: (templateId) => {
        const template = PERSONA_TEMPLATES.find((t) => t.templateId === templateId);
        if (!template) return undefined;

        const now = new Date();
        const persona: Persona = {
          id: generateId(),
          name: template.name,
          description: template.description,
          avatar: template.avatar,
          voice: { ...template.voice },
          personality: { ...template.personality, traits: [...template.personality.traits] },
          knowledge: { ...template.knowledge },
          behavior: { ...template.behavior },
          isTemplate: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          personas: [...state.personas, persona],
        }));

        return persona;
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'ai-voice-platform-personas',
      partialize: (state) => ({
        personas: state.personas,
        activePersonaId: state.activePersonaId,
      }),
    }
  )
);

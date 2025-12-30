/**
 * Persona Types
 * Core types for the AI persona configuration system
 */

export interface Persona {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  voice: PersonaVoiceConfig;
  personality: PersonaPersonalityConfig;
  knowledge: PersonaKnowledgeConfig;
  behavior: PersonaBehaviorConfig;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonaVoiceConfig {
  voiceId: string;
  stability: number;
  similarityBoost: number;
  style?: number;
  speakingRate?: number;
}

export type PersonaTone = 'formal' | 'casual' | 'playful' | 'authoritative';
export type PersonaStyle = 'concise' | 'detailed' | 'conversational';

export interface PersonaPersonalityConfig {
  traits: string[];
  tone: PersonaTone;
  style: PersonaStyle;
  customInstructions?: string;
}

export interface PersonaKnowledgeConfig {
  domain?: string;
  context?: string;
  documents?: string[];
  urls?: string[];
}

export type PersonaMode = 'assistant' | 'content' | 'developer' | 'customer_service';
export type ResponseLength = 'short' | 'medium' | 'long';

export interface PersonaBehaviorConfig {
  responseLength: ResponseLength;
  useEmoji: boolean;
  acknowledgeUncertainty: boolean;
  askClarifyingQuestions: boolean;
  mode: PersonaMode;
}

export interface PersonaTemplate extends Omit<Persona, 'id' | 'createdAt' | 'updatedAt'> {
  templateId: string;
  category: PersonaMode;
}

export interface CreatePersonaInput {
  name: string;
  description: string;
  avatar?: string;
  voice: PersonaVoiceConfig;
  personality: PersonaPersonalityConfig;
  knowledge: PersonaKnowledgeConfig;
  behavior: PersonaBehaviorConfig;
  isTemplate?: boolean;
}

export interface UpdatePersonaInput extends Partial<CreatePersonaInput> {
  id: string;
}

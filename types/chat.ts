/**
 * Chat Types
 * Types for chat conversations and messages
 */

import type { LLMMessage, LLMProviderType } from './llm';
import type { Persona } from './persona';

export interface ChatMessage extends LLMMessage {
  id: string;
  conversationId: string;
  audioUrl?: string;
  createdAt: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  personaId?: string;
  persona?: Persona;
  title?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  /** IDs of memories created from this conversation */
  memoryIds?: string[];
  /** Last message ID that was summarized into memory */
  lastSummarizedMessageId?: string;
}

export interface CreateConversationInput {
  personaId?: string;
  title?: string;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
  generateVoice?: boolean;
}

export interface ChatSettings {
  provider: LLMProviderType;
  model: string;
  temperature: number;
  maxTokens: number;
  voiceEnabled: boolean;
  autoPlayResponses: boolean;
}

export interface StreamingState {
  isStreaming: boolean;
  currentMessageId?: string;
  partialContent: string;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId?: string;
  isLoading: boolean;
  error?: string;
  streaming: StreamingState;
  settings: ChatSettings;
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  provider: 'ollama',
  model: 'llama3.2',
  temperature: 0.7,
  maxTokens: 4096,
  voiceEnabled: false,  // Disabled since no ElevenLabs key
  autoPlayResponses: false,
};

export interface ChatActions {
  createConversation: (input?: CreateConversationInput) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  setActiveConversation: (id: string) => void;
  sendMessage: (input: SendMessageInput) => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
  stopStreaming: () => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  clearError: () => void;
}

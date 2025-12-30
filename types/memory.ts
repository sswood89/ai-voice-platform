/**
 * Memory Types
 * Types for long-term memory storage and retrieval
 */

import type { LLMMessage } from './llm';

/**
 * A stored memory representing a summarized conversation segment
 */
export interface Memory {
  id: string;
  personaId: string;
  conversationId: string;
  summary: string;
  topics: string[];
  messageRange: MemoryMessageRange;
  createdAt: Date;
  expiresAt?: Date;
}

export interface MemoryMessageRange {
  startId: string;
  endId: string;
  count: number;
}

/**
 * Configuration for memory system behavior
 */
export interface MemoryConfig {
  /** Number of messages that triggers summarization (default: 15) */
  triggerMessageCount: number;
  /** Current context window size (default: 20) */
  contextWindowMessages: number;
  /** Max memories stored per persona (default: 50) */
  maxMemoriesPerPersona: number;
  /** Max memories per single conversation (default: 10) */
  maxMemoriesPerConversation: number;
  /** Memory expiration in days, null = never (default: null) */
  memoryTTLDays: number | null;
  /** Max memories to inject into context (default: 3) */
  maxInjectedMemories: number;
  /** Token budget for injected memories (default: 1000) */
  memoryTokenBudget: number;
  /** Minimum relevance score to include memory (default: 0.3) */
  minRelevanceScore: number;
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  triggerMessageCount: 15,
  contextWindowMessages: 20,
  maxMemoriesPerPersona: 50,
  maxMemoriesPerConversation: 10,
  memoryTTLDays: null,
  maxInjectedMemories: 3,
  memoryTokenBudget: 1000,
  minRelevanceScore: 0.3,
};

/**
 * Result from memory search with relevance scoring
 */
export interface MemorySearchResult {
  memory: Memory;
  relevanceScore: number;
}

/**
 * Input for creating a new memory
 */
export interface CreateMemoryInput {
  personaId: string;
  conversationId: string;
  summary: string;
  topics: string[];
  messageRange: MemoryMessageRange;
}

/**
 * Request to summarize a batch of messages
 */
export interface SummarizationRequest {
  messages: LLMMessage[];
  personaContext?: string;
}

/**
 * Result from LLM summarization
 */
export interface SummarizationResult {
  summary: string;
  topics: string[];
}

/**
 * Memory store state
 */
export interface MemoryState {
  memories: Memory[];
  config: MemoryConfig;
  isLoading: boolean;
  error?: string;
}

/**
 * Memory store actions
 */
export interface MemoryActions {
  // Getters
  getMemoriesForPersona: (personaId: string) => Memory[];
  getMemoriesForConversation: (conversationId: string) => Memory[];
  findRelevantMemories: (
    personaId: string,
    recentMessages: LLMMessage[]
  ) => MemorySearchResult[];

  // Actions
  addMemory: (input: CreateMemoryInput) => Memory;
  deleteMemory: (id: string) => void;
  clearPersonaMemories: (personaId: string) => void;
  clearConversationMemories: (conversationId: string) => void;
  updateConfig: (config: Partial<MemoryConfig>) => void;
  cleanupExpiredMemories: () => void;
  setError: (error: string | undefined) => void;
}

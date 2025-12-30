/**
 * Memory Store
 * Manages long-term memory storage and retrieval
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Memory,
  MemoryConfig,
  MemorySearchResult,
  CreateMemoryInput,
  LLMMessage,
} from '@/types';
import { DEFAULT_MEMORY_CONFIG } from '@/types';

interface MemoryState {
  memories: Memory[];
  config: MemoryConfig;
  isLoading: boolean;
  error: string | null;

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
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Calculate relevance score between a memory and recent messages
 * Uses keyword-based matching (no embeddings required)
 */
function calculateRelevance(memory: Memory, recentMessages: LLMMessage[]): number {
  // Extract text from recent messages (last 5)
  const recentText = recentMessages
    .slice(-5)
    .map((m) => m.content)
    .join(' ')
    .toLowerCase();

  // Extract meaningful words (length > 3)
  const recentWords = new Set(
    recentText
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .map((w) => w.replace(/[^\w]/g, ''))
  );

  // Score based on topic overlap
  const topicMatches = memory.topics.filter(
    (topic) =>
      recentWords.has(topic.toLowerCase()) ||
      recentText.includes(topic.toLowerCase())
  ).length;

  // Score based on summary word overlap
  const summaryWords = memory.summary
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .map((w) => w.replace(/[^\w]/g, ''));
  const wordMatches = summaryWords.filter((w) => recentWords.has(w)).length;

  // Normalize scores
  const topicScore =
    memory.topics.length > 0 ? topicMatches / memory.topics.length : 0;
  const wordScore = Math.min(wordMatches / 10, 1);

  // Recency boost (full at 0 days, decays to 0 at 30 days)
  const ageInDays =
    (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.max(0, 1 - ageInDays / 30);

  // Weighted combination
  return topicScore * 0.5 + wordScore * 0.3 + recencyBoost * 0.2;
}

/**
 * Select memories within token budget
 * Uses character-based estimation (4 chars ≈ 1 token)
 */
function selectWithinBudget(
  memories: MemorySearchResult[],
  tokenBudget: number
): MemorySearchResult[] {
  const CHARS_PER_TOKEN = 4;
  const charBudget = tokenBudget * CHARS_PER_TOKEN;
  const selected: MemorySearchResult[] = [];
  let usedChars = 0;

  for (const result of memories) {
    const memoryChars = result.memory.summary.length;
    if (usedChars + memoryChars <= charBudget) {
      selected.push(result);
      usedChars += memoryChars;
    } else {
      break;
    }
  }

  return selected;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      memories: [],
      config: DEFAULT_MEMORY_CONFIG,
      isLoading: false,
      error: null,

      getMemoriesForPersona: (personaId) => {
        return get().memories.filter((m) => m.personaId === personaId);
      },

      getMemoriesForConversation: (conversationId) => {
        return get().memories.filter((m) => m.conversationId === conversationId);
      },

      findRelevantMemories: (personaId, recentMessages) => {
        const { memories, config } = get();

        // Filter to persona's memories
        const personaMemories = memories.filter((m) => m.personaId === personaId);

        // Calculate relevance scores
        const scoredMemories: MemorySearchResult[] = personaMemories.map((memory) => ({
          memory,
          relevanceScore: calculateRelevance(memory, recentMessages),
        }));

        // Filter by minimum score and sort by relevance
        const relevantMemories = scoredMemories
          .filter((r) => r.relevanceScore >= config.minRelevanceScore)
          .sort((a, b) => b.relevanceScore - a.relevanceScore);

        // Limit by count
        const limitedMemories = relevantMemories.slice(0, config.maxInjectedMemories);

        // Select within token budget
        return selectWithinBudget(limitedMemories, config.memoryTokenBudget);
      },

      addMemory: (input) => {
        const { config, memories } = get();
        const now = new Date();

        const memory: Memory = {
          id: generateId(),
          personaId: input.personaId,
          conversationId: input.conversationId,
          summary: input.summary,
          topics: input.topics,
          messageRange: input.messageRange,
          createdAt: now,
          expiresAt: config.memoryTTLDays
            ? new Date(now.getTime() + config.memoryTTLDays * 24 * 60 * 60 * 1000)
            : undefined,
        };

        // Check if we need to remove old memories (per-persona limit)
        const personaMemories = memories.filter((m) => m.personaId === input.personaId);
        let newMemories = [...memories, memory];

        if (personaMemories.length >= config.maxMemoriesPerPersona) {
          // Remove oldest memory for this persona
          const oldestPersonaMemory = personaMemories.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )[0];
          newMemories = newMemories.filter((m) => m.id !== oldestPersonaMemory.id);
        }

        set({ memories: newMemories });
        return memory;
      },

      deleteMemory: (id) => {
        set((state) => ({
          memories: state.memories.filter((m) => m.id !== id),
        }));
      },

      clearPersonaMemories: (personaId) => {
        set((state) => ({
          memories: state.memories.filter((m) => m.personaId !== personaId),
        }));
      },

      clearConversationMemories: (conversationId) => {
        set((state) => ({
          memories: state.memories.filter((m) => m.conversationId !== conversationId),
        }));
      },

      updateConfig: (configUpdate) => {
        set((state) => ({
          config: { ...state.config, ...configUpdate },
        }));
      },

      cleanupExpiredMemories: () => {
        const now = Date.now();
        set((state) => ({
          memories: state.memories.filter(
            (m) => !m.expiresAt || new Date(m.expiresAt).getTime() > now
          ),
        }));
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'ai-voice-platform-memories',
      partialize: (state) => ({
        memories: state.memories,
        config: state.config,
      }),
    }
  )
);

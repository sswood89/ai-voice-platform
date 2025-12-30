/**
 * Memory Retriever
 * Finds relevant memories for current conversation context
 */

import type { Memory, MemorySearchResult, LLMMessage, MemoryConfig } from '@/types';
import { DEFAULT_MEMORY_CONFIG } from '@/types';

/**
 * Calculate relevance score between a memory and recent messages
 * Uses keyword-based matching (no embeddings required)
 */
export function calculateRelevance(
  memory: Memory,
  recentMessages: LLMMessage[]
): number {
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
export function selectWithinBudget(
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

/**
 * Find relevant memories for a conversation context
 */
export function findRelevantMemories(
  personaId: string,
  allMemories: Memory[],
  recentMessages: LLMMessage[],
  config: Partial<MemoryConfig> = {}
): MemorySearchResult[] {
  const mergedConfig = { ...DEFAULT_MEMORY_CONFIG, ...config };

  // Filter to persona's memories
  const personaMemories = allMemories.filter((m) => m.personaId === personaId);

  if (personaMemories.length === 0 || recentMessages.length === 0) {
    return [];
  }

  // Calculate relevance scores
  const scoredMemories: MemorySearchResult[] = personaMemories.map((memory) => ({
    memory,
    relevanceScore: calculateRelevance(memory, recentMessages),
  }));

  // Filter by minimum score and sort by relevance
  const relevantMemories = scoredMemories
    .filter((r) => r.relevanceScore >= mergedConfig.minRelevanceScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Limit by count
  const limitedMemories = relevantMemories.slice(0, mergedConfig.maxInjectedMemories);

  // Select within token budget
  return selectWithinBudget(limitedMemories, mergedConfig.memoryTokenBudget);
}

/**
 * Get all memories for a persona, sorted by recency
 */
export function getPersonaMemories(
  personaId: string,
  allMemories: Memory[]
): Memory[] {
  return allMemories
    .filter((m) => m.personaId === personaId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get memories for a specific conversation
 */
export function getConversationMemories(
  conversationId: string,
  allMemories: Memory[]
): Memory[] {
  return allMemories
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

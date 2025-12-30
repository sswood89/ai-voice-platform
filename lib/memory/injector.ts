/**
 * Memory Injector
 * Injects relevant memories into system prompts
 */

import type { Memory, Persona } from '@/types';
import { buildSystemPrompt } from '@/lib/persona';

/**
 * Format memories as readable context for the system prompt
 */
export function formatMemoriesForContext(memories: Memory[]): string {
  if (memories.length === 0) {
    return '';
  }

  const memoryLines = memories.map((m, i) => {
    const topicsStr = m.topics.length > 0 ? ` [${m.topics.join(', ')}]` : '';
    return `${i + 1}. ${m.summary}${topicsStr}`;
  });

  return `## Previous Conversation Context

The following are summaries of earlier conversations with this user:

${memoryLines.join('\n\n')}

Use this context to provide more personalized and consistent responses. Don't explicitly reference "remembering" unless the user asks about past conversations.

---

`;
}

/**
 * Build a system prompt with memories prepended
 */
export function buildSystemPromptWithMemories(
  persona: Persona,
  memories: Memory[]
): string {
  const memorySection = formatMemoriesForContext(memories);
  const personaPrompt = buildSystemPrompt(persona);

  return memorySection + personaPrompt;
}

/**
 * Build a system prompt from memories only (no persona)
 */
export function buildMemoryOnlyPrompt(memories: Memory[]): string {
  if (memories.length === 0) {
    return '';
  }

  return `## Conversation Context

You have had previous conversations with this user. Here are relevant summaries:

${memories.map((m, i) => `${i + 1}. ${m.summary}`).join('\n\n')}

Use this context to provide more personalized responses.`;
}

/**
 * Estimate token count for a prompt (rough estimation)
 */
export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Check if adding memories would exceed a token budget
 */
export function wouldExceedBudget(
  existingPrompt: string,
  memories: Memory[],
  maxTokens: number
): boolean {
  const existingTokens = estimateTokens(existingPrompt);
  const memoryText = formatMemoriesForContext(memories);
  const memoryTokens = estimateTokens(memoryText);

  return existingTokens + memoryTokens > maxTokens;
}

/**
 * Memory Summarizer
 * Uses LLM to create conversation summaries
 */

import type { LLMMessage, SummarizationResult, LLMProviderType } from '@/types';

const SUMMARIZATION_SYSTEM_PROMPT = `You are a conversation memory assistant. Your task is to create a concise summary of the following conversation segment that preserves:

1. Key decisions made
2. Important facts mentioned
3. User preferences expressed
4. Action items or commitments
5. Emotional context and tone

Respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "summary": "A 2-4 sentence summary of the key points",
  "topics": ["topic1", "topic2", "topic3"]
}

The topics array should contain 3-5 key topic tags that could be used to find this memory later.`;

/**
 * Format messages for summarization
 */
function formatMessagesForSummary(messages: LLMMessage[]): string {
  return messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');
}

/**
 * Parse LLM response to extract summary and topics
 */
function parseSummarizationResponse(response: string): SummarizationResult {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(response.trim());
    return {
      summary: parsed.summary || '',
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    };
  } catch {
    // Fallback: extract from response if JSON parsing fails
    console.warn('Failed to parse summarization response as JSON, using fallback');
    return {
      summary: response.slice(0, 500),
      topics: extractTopicsFromText(response),
    };
  }
}

/**
 * Extract potential topics from text (fallback)
 */
function extractTopicsFromText(text: string): string[] {
  // Simple noun extraction - get capitalized words and common patterns
  const words = text.split(/\s+/);
  const topics: string[] = [];

  for (const word of words) {
    const cleaned = word.replace(/[^\w]/g, '');
    // Include words that are capitalized (potential names/topics) or longer nouns
    if (cleaned.length > 4 && (cleaned[0] === cleaned[0].toUpperCase() || cleaned.length > 6)) {
      if (!topics.includes(cleaned.toLowerCase())) {
        topics.push(cleaned.toLowerCase());
      }
    }
    if (topics.length >= 5) break;
  }

  return topics;
}

export interface SummarizeOptions {
  messages: LLMMessage[];
  provider: LLMProviderType;
  model: string;
  personaContext?: string;
}

/**
 * Summarize a batch of messages using the configured LLM
 */
export async function summarizeMessages(
  options: SummarizeOptions
): Promise<SummarizationResult> {
  const { messages, provider, model, personaContext } = options;

  // Format messages for the prompt
  const formattedMessages = formatMessagesForSummary(messages);

  // Build the user message
  let userPrompt = `Please summarize this conversation segment:\n\n${formattedMessages}`;

  if (personaContext) {
    userPrompt += `\n\nThis conversation was with a persona described as: ${personaContext}`;
  }

  // Call the summarization API
  const response = await fetch('/api/memory/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
      provider,
      model,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Summarization failed: ${error}`);
  }

  const data = await response.json();
  return parseSummarizationResponse(data.content);
}

/**
 * Check if a conversation needs summarization
 */
export function needsSummarization(
  messageCount: number,
  contextWindow: number,
  triggerCount: number
): boolean {
  return messageCount > contextWindow + triggerCount;
}

/**
 * Get the messages that should be summarized
 */
export function getMessagesToSummarize<T extends { id: string }>(
  messages: T[],
  contextWindow: number,
  triggerCount: number,
  lastSummarizedId?: string
): T[] {
  // If we have a last summarized ID, start from after that
  let startIndex = 0;
  if (lastSummarizedId) {
    const lastSummarizedIndex = messages.findIndex((m) => m.id === lastSummarizedId);
    if (lastSummarizedIndex !== -1) {
      startIndex = lastSummarizedIndex + 1;
    }
  }

  // Calculate how many messages are beyond the context window
  const excessMessages = messages.length - contextWindow;

  if (excessMessages <= 0) {
    return [];
  }

  // Get the batch of messages to summarize (up to triggerCount)
  const endIndex = Math.min(startIndex + triggerCount, messages.length - contextWindow);

  if (endIndex <= startIndex) {
    return [];
  }

  return messages.slice(startIndex, endIndex);
}

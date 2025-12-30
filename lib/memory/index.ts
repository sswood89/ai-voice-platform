/**
 * Memory Module
 * Long-term memory management for conversations
 */

// Summarization
export {
  summarizeMessages,
  needsSummarization,
  getMessagesToSummarize,
  type SummarizeOptions,
} from './summarizer';

// Retrieval
export {
  calculateRelevance,
  selectWithinBudget,
  findRelevantMemories,
  getPersonaMemories,
  getConversationMemories,
} from './retriever';

// Injection
export {
  formatMemoriesForContext,
  buildSystemPromptWithMemories,
  buildMemoryOnlyPrompt,
  estimateTokens,
  wouldExceedBudget,
} from './injector';

/**
 * AI Voice Platform Types
 * Central export for all type definitions
 */

// Persona types
export type {
  Persona,
  PersonaVoiceConfig,
  PersonaTone,
  PersonaStyle,
  PersonaPersonalityConfig,
  PersonaKnowledgeConfig,
  PersonaMode,
  ResponseLength,
  PersonaBehaviorConfig,
  PersonaTemplate,
  CreatePersonaInput,
  UpdatePersonaInput,
} from './persona';

// Voice types
export type {
  Voice,
  VoiceSettings,
  VoiceCloneRequest,
  VoiceCloneResponse,
  TTSRequest,
  TTSResponse,
  ElevenLabsVoice,
  ElevenLabsVoicesResponse,
  AudioCacheEntry,
  TTSModel,
} from './voice';

export { DEFAULT_VOICE_SETTINGS, TTS_MODELS } from './voice';

// LLM types
export type {
  LLMProviderType,
  LLMProviderConfig,
  MessageRole,
  LLMMessage,
  LLMStreamOptions,
  LLMCompleteOptions,
  LLMModel,
  LLMProvider,
  LLMProviderRegistry,
} from './llm';

export {
  ANTHROPIC_MODELS,
  OPENAI_MODELS,
  OLLAMA_MODELS,
  MODEL_RECOMMENDATIONS,
} from './llm';

// Chat types
export type {
  ChatMessage,
  Conversation,
  CreateConversationInput,
  SendMessageInput,
  ChatSettings,
  StreamingState,
  ChatState,
  ChatActions,
} from './chat';

export { DEFAULT_CHAT_SETTINGS } from './chat';

// Memory types
export type {
  Memory,
  MemoryMessageRange,
  MemoryConfig,
  MemorySearchResult,
  CreateMemoryInput,
  SummarizationRequest,
  SummarizationResult,
  MemoryState,
  MemoryActions,
} from './memory';

export { DEFAULT_MEMORY_CONFIG } from './memory';

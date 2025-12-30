/**
 * LLM Provider Types
 * Types for multi-provider LLM abstraction
 */

export type LLMProviderType = 'anthropic' | 'openai' | 'ollama';

export interface LLMProviderConfig {
  type: LLMProviderType;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface LLMMessage {
  role: MessageRole;
  content: string;
}

export interface LLMStreamOptions {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMCompleteOptions extends LLMStreamOptions {
  stream?: false;
}

export interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  recommended?: boolean;
  useCases: ('assistant' | 'content' | 'developer' | 'customer_service')[];
}

export interface LLMProvider {
  type: LLMProviderType;
  name: string;
  models: LLMModel[];
  isConfigured: () => boolean;
  stream(options: LLMStreamOptions): AsyncGenerator<string, void, unknown>;
  complete(options: LLMCompleteOptions): Promise<string>;
}

export interface LLMProviderRegistry {
  providers: Map<LLMProviderType, LLMProvider>;
  getProvider(type: LLMProviderType): LLMProvider | undefined;
  registerProvider(provider: LLMProvider): void;
  getConfiguredProviders(): LLMProvider[];
}

// Model catalogs per provider
export const ANTHROPIC_MODELS: LLMModel[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    contextWindow: 200000,
    recommended: true,
    useCases: ['assistant', 'content', 'developer', 'customer_service'],
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    contextWindow: 200000,
    recommended: false,
    useCases: ['customer_service', 'assistant'],
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    contextWindow: 200000,
    recommended: false,
    useCases: ['content', 'developer'],
  },
];

export const OPENAI_MODELS: LLMModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    contextWindow: 128000,
    recommended: true,
    useCases: ['assistant', 'content', 'developer', 'customer_service'],
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    contextWindow: 128000,
    recommended: false,
    useCases: ['customer_service', 'assistant'],
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    contextWindow: 128000,
    recommended: false,
    useCases: ['content', 'developer'],
  },
];

export const OLLAMA_MODELS: LLMModel[] = [
  {
    id: 'llama3.2',
    name: 'Llama 3.2',
    contextWindow: 128000,
    recommended: true,
    useCases: ['assistant', 'content', 'customer_service'],
  },
  {
    id: 'codellama',
    name: 'Code Llama',
    contextWindow: 16000,
    recommended: false,
    useCases: ['developer'],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    contextWindow: 32000,
    recommended: false,
    useCases: ['assistant', 'content'],
  },
];

export const MODEL_RECOMMENDATIONS: Record<string, Record<LLMProviderType, string>> = {
  assistant: {
    anthropic: 'claude-sonnet-4-20250514',
    openai: 'gpt-4o',
    ollama: 'llama3.2',
  },
  content: {
    anthropic: 'claude-sonnet-4-20250514',
    openai: 'gpt-4o',
    ollama: 'llama3.2',
  },
  developer: {
    anthropic: 'claude-sonnet-4-20250514',
    openai: 'gpt-4o',
    ollama: 'codellama',
  },
  customer_service: {
    anthropic: 'claude-3-5-haiku-20241022',
    openai: 'gpt-4o-mini',
    ollama: 'llama3.2',
  },
};

/**
 * LLM Provider Factory
 * Creates provider instances based on configuration
 */

import type {
  LLMProviderType,
  LLMProviderConfig,
  LLMProvider,
} from '@/types';
import { MODEL_RECOMMENDATIONS } from '@/types';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';
import { OllamaProvider } from './providers/ollama';

/**
 * Create an LLM provider instance
 */
export function createLLMProvider(config: LLMProviderConfig): LLMProvider {
  switch (config.type) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}

/**
 * Get the recommended model for a given use case and provider
 */
export function getRecommendedModel(
  useCase: 'assistant' | 'content' | 'developer' | 'customer_service',
  providerType: LLMProviderType
): string {
  return MODEL_RECOMMENDATIONS[useCase]?.[providerType] ?? '';
}

/**
 * Provider registry for managing multiple providers
 */
export class ProviderRegistry {
  private providers: Map<LLMProviderType, LLMProvider> = new Map();

  register(config: LLMProviderConfig): void {
    const provider = createLLMProvider(config);
    this.providers.set(config.type, provider);
  }

  get(type: LLMProviderType): LLMProvider | undefined {
    return this.providers.get(type);
  }

  getConfigured(): LLMProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isConfigured());
  }

  getAll(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  has(type: LLMProviderType): boolean {
    return this.providers.has(type);
  }

  remove(type: LLMProviderType): boolean {
    return this.providers.delete(type);
  }

  clear(): void {
    this.providers.clear();
  }
}

// Global registry instance
let registryInstance: ProviderRegistry | null = null;

export function getProviderRegistry(): ProviderRegistry {
  if (!registryInstance) {
    registryInstance = new ProviderRegistry();
  }
  return registryInstance;
}

/**
 * Initialize providers from environment variables
 */
export function initializeProviders(): ProviderRegistry {
  const registry = getProviderRegistry();

  // Register Anthropic if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    registry.register({
      type: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  // Register OpenAI if API key is available
  if (process.env.OPENAI_API_KEY) {
    registry.register({
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Register Ollama (no API key needed)
  registry.register({
    type: 'ollama',
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  });

  return registry;
}

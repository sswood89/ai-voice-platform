/**
 * Anthropic Provider
 * Claude API integration with streaming support
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  LLMProvider,
  LLMProviderConfig,
  LLMModel,
  LLMStreamOptions,
  LLMCompleteOptions,
} from '@/types';
import { ANTHROPIC_MODELS } from '@/types';

export class AnthropicProvider implements LLMProvider {
  type = 'anthropic' as const;
  name = 'Anthropic Claude';
  models: LLMModel[] = ANTHROPIC_MODELS;

  private client: Anthropic | null = null;
  private apiKey: string | undefined;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    if (this.apiKey) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.client;
  }

  async *stream(options: LLMStreamOptions): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw new Error('Anthropic client not configured');
    }

    const { model, messages, temperature = 0.7, maxTokens = 4096, systemPrompt } = options;

    // Convert messages to Anthropic format
    const anthropicMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Build system message from systemPrompt and any system messages
    const systemMessages = messages
      .filter(m => m.role === 'system')
      .map(m => m.content);

    const system = systemPrompt
      ? [systemPrompt, ...systemMessages].join('\n\n')
      : systemMessages.join('\n\n') || undefined;

    const stream = this.client.messages.stream({
      model,
      messages: anthropicMessages,
      max_tokens: maxTokens,
      temperature,
      system,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  async complete(options: LLMCompleteOptions): Promise<string> {
    if (!this.client) {
      throw new Error('Anthropic client not configured');
    }

    const { model, messages, temperature = 0.7, maxTokens = 4096, systemPrompt } = options;

    // Convert messages to Anthropic format
    const anthropicMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Build system message
    const systemMessages = messages
      .filter(m => m.role === 'system')
      .map(m => m.content);

    const system = systemPrompt
      ? [systemPrompt, ...systemMessages].join('\n\n')
      : systemMessages.join('\n\n') || undefined;

    const response = await this.client.messages.create({
      model,
      messages: anthropicMessages,
      max_tokens: maxTokens,
      temperature,
      system,
    });

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    return textContent?.type === 'text' ? textContent.text : '';
  }
}

/**
 * OpenAI Provider
 * GPT API integration with streaming support
 */

import OpenAI from 'openai';
import type {
  LLMProvider,
  LLMProviderConfig,
  LLMModel,
  LLMStreamOptions,
  LLMCompleteOptions,
} from '@/types';
import { OPENAI_MODELS } from '@/types';

export class OpenAIProvider implements LLMProvider {
  type = 'openai' as const;
  name = 'OpenAI GPT';
  models: LLMModel[] = OPENAI_MODELS;

  private client: OpenAI | null = null;
  private apiKey: string | undefined;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    if (this.apiKey) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: false,
      });
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.client;
  }

  async *stream(options: LLMStreamOptions): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw new Error('OpenAI client not configured');
    }

    const { model, messages, temperature = 0.7, maxTokens = 4096, systemPrompt } = options;

    // Convert messages to OpenAI format
    const openAIMessages: OpenAI.ChatCompletionMessageParam[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      openAIMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add conversation messages
    for (const msg of messages) {
      openAIMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    const stream = await this.client.chat.completions.create({
      model,
      messages: openAIMessages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async complete(options: LLMCompleteOptions): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not configured');
    }

    const { model, messages, temperature = 0.7, maxTokens = 4096, systemPrompt } = options;

    // Convert messages to OpenAI format
    const openAIMessages: OpenAI.ChatCompletionMessageParam[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      openAIMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add conversation messages
    for (const msg of messages) {
      openAIMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    const response = await this.client.chat.completions.create({
      model,
      messages: openAIMessages,
      max_tokens: maxTokens,
      temperature,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}

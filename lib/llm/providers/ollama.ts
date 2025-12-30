/**
 * Ollama Provider
 * Local model integration with streaming support
 */

import type {
  LLMProvider,
  LLMProviderConfig,
  LLMModel,
  LLMStreamOptions,
  LLMCompleteOptions,
} from '@/types';
import { OLLAMA_MODELS } from '@/types';

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaChatResponse {
  model: string;
  message: OllamaChatMessage;
  done: boolean;
}

interface OllamaStreamChunk {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export class OllamaProvider implements LLMProvider {
  type = 'ollama' as const;
  name = 'Ollama (Local)';
  models: LLMModel[] = OLLAMA_MODELS;

  private baseUrl: string;

  constructor(config: LLMProviderConfig) {
    this.baseUrl = config.baseUrl ?? 'http://localhost:11434';
  }

  isConfigured(): boolean {
    // Ollama doesn't require API key, but we could check if it's running
    return true;
  }

  /**
   * Check if Ollama is available and running
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get list of available models from Ollama
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) ?? [];
    } catch {
      return [];
    }
  }

  async *stream(options: LLMStreamOptions): AsyncGenerator<string, void, unknown> {
    const { model, messages, temperature = 0.7, maxTokens = 4096, systemPrompt } = options;

    // Build messages array
    const ollamaMessages: OllamaChatMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      ollamaMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add conversation messages
    for (const msg of messages) {
      ollamaMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    const request: OllamaChatRequest = {
      model,
      messages: ollamaMessages,
      stream: true,
      options: {
        temperature,
        num_predict: maxTokens,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body available');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const chunk: OllamaStreamChunk = JSON.parse(line);
            if (chunk.message?.content) {
              yield chunk.message.content;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async complete(options: LLMCompleteOptions): Promise<string> {
    const { model, messages, temperature = 0.7, maxTokens = 4096, systemPrompt } = options;

    // Build messages array
    const ollamaMessages: OllamaChatMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      ollamaMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add conversation messages
    for (const msg of messages) {
      ollamaMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    const request: OllamaChatRequest = {
      model,
      messages: ollamaMessages,
      stream: false,
      options: {
        temperature,
        num_predict: maxTokens,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data: OllamaChatResponse = await response.json();
    return data.message?.content ?? '';
  }
}

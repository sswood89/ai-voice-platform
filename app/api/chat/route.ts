/**
 * Chat API Route
 * Streaming chat endpoint with LLM provider support
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider } from '@/lib/llm';
import type { LLMProviderType, LLMMessage } from '@/types';

// Use Node.js runtime for localhost access (Ollama)
export const runtime = 'nodejs';

interface ChatRequestBody {
  messages: LLMMessage[];
  provider: LLMProviderType;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export async function POST(request: NextRequest) {
  console.log('Chat API: Request received');
  try {
    const body: ChatRequestBody = await request.json();
    console.log('Chat API: Body parsed', { provider: body.provider, model: body.model });
    const {
      messages,
      provider,
      model,
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt,
    } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Get API key from environment
    let apiKey: string | undefined;
    switch (provider) {
      case 'anthropic':
        apiKey = process.env.ANTHROPIC_API_KEY;
        break;
      case 'openai':
        apiKey = process.env.OPENAI_API_KEY;
        break;
      case 'ollama':
        // Ollama doesn't need an API key
        break;
    }

    // If no API key for cloud provider, fall back to Ollama
    let actualProvider = provider;
    let actualModel = model;

    if (!apiKey && provider !== 'ollama') {
      console.log(`No API key for ${provider}, falling back to Ollama`);
      actualProvider = 'ollama';
      actualModel = 'llama3.2';
    }

    // Create provider instance
    const ollamaUrl = actualProvider === 'ollama'
      ? (process.env.OLLAMA_BASE_URL || 'http://localhost:11434')
      : undefined;

    console.log('Chat API:', { provider: actualProvider, model: actualModel, ollamaUrl });

    const llmProvider = createLLMProvider({
      type: actualProvider,
      apiKey: actualProvider === 'ollama' ? undefined : apiKey,
      baseUrl: ollamaUrl,
    });

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = llmProvider.stream({
            model: actualModel,
            messages,
            temperature,
            maxTokens,
            systemPrompt,
          });

          for await (const chunk of generator) {
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    console.error('Chat API stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

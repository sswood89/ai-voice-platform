/**
 * Memory Summarize API Route
 * Generates summaries of conversation segments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider } from '@/lib/llm';
import type { LLMProviderType, LLMMessage } from '@/types';

// Use Node.js runtime for localhost access (Ollama)
export const runtime = 'nodejs';

interface SummarizeRequestBody {
  messages: LLMMessage[];
  systemPrompt: string;
  provider: LLMProviderType;
  model: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequestBody = await request.json();
    const { messages, systemPrompt, provider, model } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    if (!systemPrompt) {
      return NextResponse.json(
        { error: 'System prompt is required' },
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
      console.log(`No API key for ${provider}, falling back to Ollama for summarization`);
      actualProvider = 'ollama';
      actualModel = 'llama3.2';
    }

    // Create provider instance
    const ollamaUrl = actualProvider === 'ollama'
      ? (process.env.OLLAMA_BASE_URL || 'http://localhost:11434')
      : undefined;

    const llmProvider = createLLMProvider({
      type: actualProvider,
      apiKey: actualProvider === 'ollama' ? undefined : apiKey,
      baseUrl: ollamaUrl,
    });

    // Use complete() for non-streaming response
    const content = await llmProvider.complete({
      model: actualModel,
      messages,
      systemPrompt,
      temperature: 0.3, // Lower temperature for more consistent summaries
      maxTokens: 500, // Summaries should be concise
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Summarize API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

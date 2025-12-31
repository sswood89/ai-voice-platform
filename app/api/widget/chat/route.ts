import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, sanitizeInput } from '@/lib/widget/security';
import { createLLMProvider } from '@/lib/llm/provider-factory';
import { buildSystemPrompt } from '@/lib/persona/prompt-builder';
import type { Persona } from '@/types';

// In-memory session storage (use Redis in production)
const sessionMessages = new Map<string, { role: string; content: string }[]>();

/**
 * POST /api/widget/chat
 * Send a message to the widget chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { embedId, sessionId, message, voiceEnabled } = body;

    if (!embedId || !sessionId || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Rate limit check
    const rateLimit = checkRateLimit(sessionId, 30, 60000); // 30 messages per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    // Sanitize input
    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get embed and persona
    const { data: embed, error: embedError } = await supabase
      .from('embeds')
      .select(`
        *,
        persona:personas(*),
        user:profiles(tier)
      `)
      .eq('id', embedId)
      .eq('is_active', true)
      .single();

    if (embedError || !embed) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    // Check embed rate limit
    const embedRateLimit = checkRateLimit(`embed_${embedId}`, embed.rate_limit || 100, 3600000);
    if (!embedRateLimit.allowed) {
      return NextResponse.json(
        { error: 'Widget rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get or create session messages
    if (!sessionMessages.has(sessionId)) {
      sessionMessages.set(sessionId, []);
    }
    const messages = sessionMessages.get(sessionId)!;

    // Add user message
    messages.push({ role: 'user', content: sanitizedMessage });

    // Keep only last 20 messages for context
    if (messages.length > 20) {
      messages.splice(0, messages.length - 20);
    }

    // Build persona config for prompt
    const personaConfig: Persona = {
      id: embed.persona.id,
      name: embed.persona.name,
      description: embed.persona.description || '',
      voice: {
        voiceId: embed.persona.voice_id || '',
        stability: 0.5,
        similarityBoost: 0.5,
      },
      personality: {
        traits: [],
        tone: 'casual',
        style: 'conversational',
        customInstructions: embed.persona.system_prompt,
      },
      knowledge: {},
      behavior: {
        responseLength: 'medium',
        useEmoji: false,
        acknowledgeUncertainty: true,
        askClarifyingQuestions: false,
        mode: 'customer_service',
      },
      isTemplate: false,
      createdAt: new Date(embed.persona.created_at),
      updatedAt: new Date(embed.persona.updated_at),
    };

    // Build system prompt
    const systemPrompt = buildSystemPrompt(personaConfig);

    // Get LLM provider
    const provider = createLLMProvider(embed.persona.provider || 'anthropic');

    // Generate response
    const llmMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await provider.complete({
      messages: llmMessages,
      model: embed.persona.model || 'claude-sonnet-4-20250514',
      maxTokens: 1024, // Shorter responses for widget
      temperature: embed.persona.temperature || 0.7,
    });

    // Add assistant response to session
    messages.push({ role: 'assistant', content: response });

    // Track usage (if user has tier info)
    if (embed.user_id) {
      try {
        await supabase.from('usage').insert({
          user_id: embed.user_id,
          type: 'llm_tokens',
          amount: Math.ceil((sanitizedMessage.length + response.length) / 4),
          provider: embed.persona.provider || 'anthropic',
          model: embed.persona.model,
        });
      } catch {
        // Ignore usage tracking errors
      }
    }

    // Generate TTS if enabled (and voice is configured)
    let audioUrl: string | undefined;
    if (voiceEnabled && embed.persona.voice_id) {
      try {
        const ttsResponse = await fetch(`${request.nextUrl.origin}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: response.slice(0, 500), // Limit TTS length
            voiceId: embed.persona.voice_id,
          }),
        });

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json();
          audioUrl = ttsData.audioUrl;
        }
      } catch {
        // Ignore TTS errors
      }
    }

    return NextResponse.json({
      response,
      audioUrl,
    });
  } catch (error) {
    console.error('Widget chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

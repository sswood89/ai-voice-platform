/**
 * TTS API Route
 * Text-to-speech endpoint using ElevenLabs
 */

import { NextRequest, NextResponse } from 'next/server';
import { TTS_MODELS, DEFAULT_VOICE_SETTINGS } from '@/types';

interface TTSRequestBody {
  text: string;
  voiceId: string;
  modelId?: string;
  voiceSettings?: {
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
  stream?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const body: TTSRequestBody = await request.json();
    const {
      text,
      voiceId,
      modelId = TTS_MODELS.MULTILINGUAL_V2,
      voiceSettings = DEFAULT_VOICE_SETTINGS,
      stream = false,
    } = body;

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: 'Text and voiceId are required' },
        { status: 400 }
      );
    }

    const endpoint = stream
      ? `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`
      : `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: voiceSettings.stability ?? DEFAULT_VOICE_SETTINGS.stability,
          similarity_boost: voiceSettings.similarityBoost ?? DEFAULT_VOICE_SETTINGS.similarityBoost,
          style: voiceSettings.style ?? DEFAULT_VOICE_SETTINGS.style,
          use_speaker_boost: voiceSettings.useSpeakerBoost ?? DEFAULT_VOICE_SETTINGS.useSpeakerBoost,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `TTS API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    if (stream && response.body) {
      // Return streaming response
      return new Response(response.body, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    // Return buffered response
    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

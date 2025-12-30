/**
 * Voices API Route
 * List available voices from ElevenLabs
 */

import { NextRequest, NextResponse } from 'next/server';
import { listVoices } from '@/lib/voice';

export async function GET(_request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const voices = await listVoices(apiKey);

    return NextResponse.json({ voices });
  } catch (error) {
    console.error('Voices API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

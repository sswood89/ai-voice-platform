/**
 * Voices API Route
 * List available voices from ElevenLabs
 */

import { NextRequest, NextResponse } from 'next/server';
import { listVoices } from '@/lib/voice';

export async function GET(_request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    // Return empty voices list if ElevenLabs isn't configured
    if (!apiKey) {
      return NextResponse.json({
        voices: [],
        configured: false,
        message: 'ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to enable voice features.'
      });
    }

    const voices = await listVoices(apiKey);

    return NextResponse.json({ voices, configured: true });
  } catch (error) {
    console.error('Voices API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

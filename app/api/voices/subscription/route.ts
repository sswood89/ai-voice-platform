/**
 * Voice Subscription API Route
 * Get ElevenLabs subscription info (character usage and limits)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    // Return demo subscription data if ElevenLabs isn't configured
    if (!apiKey) {
      return NextResponse.json({
        characterCount: 0,
        characterLimit: 0,
        voiceCount: 0,
        voiceLimit: 0,
        canClone: false,
        tier: 'free',
        nextResetDate: null,
        configured: false,
        message: 'ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to enable voice features.'
      });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Failed to get subscription info: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      characterCount: data.character_count ?? 0,
      characterLimit: data.character_limit ?? 0,
      voiceCount: data.voice_count ?? 0,
      voiceLimit: data.voice_limit ?? 0,
      canClone: data.can_use_instant_voice_cloning ?? false,
      tier: data.tier ?? 'free',
      nextResetDate: data.next_character_count_reset_unix
        ? new Date(data.next_character_count_reset_unix * 1000).toISOString()
        : null,
      configured: true,
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

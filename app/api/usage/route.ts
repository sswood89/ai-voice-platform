import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUsageSummary, checkTierLimit } from '@/lib/usage/track';
import { TIER_LIMITS } from '@/lib/supabase/types';

/**
 * GET /api/usage
 * Get current user's usage summary and limits
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    const tier = (profile?.tier ?? 'free') as keyof typeof TIER_LIMITS;
    const tierLimits = TIER_LIMITS[tier];

    // Get usage summary
    const summary = await getUsageSummary(user.id);

    // Check various limits
    const [messageCheck, ttsCheck, cloneCheck] = await Promise.all([
      checkTierLimit(user.id, 'message'),
      checkTierLimit(user.id, 'tts'),
      checkTierLimit(user.id, 'voice_clone'),
    ]);

    return NextResponse.json({
      tier,
      usage: summary,
      limits: {
        messages: {
          current: messageCheck.current ?? 0,
          limit: tierLimits.messages_per_month,
          unlimited: tierLimits.messages_per_month === -1,
        },
        personas: {
          limit: tierLimits.personas,
          unlimited: tierLimits.personas === -1,
        },
        voice: {
          enabled: tierLimits.voice_enabled,
          clones: {
            current: cloneCheck.current ?? 0,
            limit: cloneCheck.limit ?? 5,
          },
          ttsCharacters: summary.tts_characters,
        },
        embeds: {
          limit: tierLimits.embeds,
          unlimited: tierLimits.embeds === -1,
        },
        api: {
          enabled: tierLimits.api_access,
        },
      },
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage' },
      { status: 500 }
    );
  }
}

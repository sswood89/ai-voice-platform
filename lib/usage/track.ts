/**
 * Usage Tracking Middleware
 * Tracks API usage for billing and rate limiting
 */

import { createClient } from '@/lib/supabase/server';
import type { UsageType, TIER_LIMITS } from '@/lib/supabase/types';

interface TrackUsageOptions {
  userId: string;
  type: UsageType;
  amount: number;
  provider?: string;
  model?: string;
}

/**
 * Record usage for a user
 * This is called after successful API operations
 */
export async function trackUsage(options: TrackUsageOptions): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from('usage').insert({
      user_id: options.userId,
      type: options.type,
      amount: options.amount,
      provider: options.provider ?? null,
      model: options.model ?? null,
    });
  } catch (error) {
    // Log but don't fail the request if usage tracking fails
    console.error('Failed to track usage:', error);
  }
}

/**
 * Get usage summary for current billing period
 */
export async function getUsageSummary(userId: string): Promise<{
  llm_tokens: number;
  tts_characters: number;
  voice_clones: number;
}> {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage')
    .select('type, amount')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) throw error;

  const summary = {
    llm_tokens: 0,
    tts_characters: 0,
    voice_clones: 0,
  };

  for (const record of data ?? []) {
    switch (record.type) {
      case 'llm_tokens':
        summary.llm_tokens += record.amount;
        break;
      case 'tts_characters':
        summary.tts_characters += record.amount;
        break;
      case 'voice_clone':
        summary.voice_clones += record.amount;
        break;
    }
  }

  return summary;
}

/**
 * Check if user can perform an action based on tier limits
 */
export async function checkTierLimit(
  userId: string,
  action: 'message' | 'tts' | 'voice_clone' | 'embed' | 'api'
): Promise<{
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}> {
  const supabase = await createClient();

  // Get user profile to check tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { allowed: false, reason: 'User not found' };
  }

  const { TIER_LIMITS } = await import('@/lib/supabase/types');
  const tierLimits = TIER_LIMITS[profile.tier as keyof typeof TIER_LIMITS];

  // Get current usage
  const summary = await getUsageSummary(userId);

  switch (action) {
    case 'message': {
      const limit = tierLimits.messages_per_month;
      if (limit === -1) return { allowed: true };

      // Estimate messages from tokens (avg 1000 tokens per message exchange)
      const estimatedMessages = Math.floor(summary.llm_tokens / 1000);
      if (estimatedMessages >= limit) {
        return {
          allowed: false,
          reason: 'Monthly message limit reached',
          current: estimatedMessages,
          limit,
        };
      }
      return { allowed: true, current: estimatedMessages, limit };
    }

    case 'tts': {
      if (!tierLimits.voice_enabled) {
        return { allowed: false, reason: 'Voice not available on free tier' };
      }
      return { allowed: true };
    }

    case 'voice_clone': {
      if (!tierLimits.voice_enabled) {
        return { allowed: false, reason: 'Voice cloning not available on free tier' };
      }
      // Allow 5 voice clones per month for pro+
      if (summary.voice_clones >= 5) {
        return {
          allowed: false,
          reason: 'Monthly voice clone limit reached',
          current: summary.voice_clones,
          limit: 5,
        };
      }
      return { allowed: true, current: summary.voice_clones, limit: 5 };
    }

    case 'embed': {
      if (tierLimits.embeds === 0) {
        return { allowed: false, reason: 'Embeds not available on free tier' };
      }
      // Would need to count actual embeds
      return { allowed: true };
    }

    case 'api': {
      if (!tierLimits.api_access) {
        return { allowed: false, reason: 'API access not available on this tier' };
      }
      return { allowed: true };
    }

    default:
      return { allowed: true };
  }
}

/**
 * Estimate token count from text (rough approximation)
 * Uses ~4 characters per token heuristic
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

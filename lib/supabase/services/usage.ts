import { createClient } from '../client';
import type { UsageType, TIER_LIMITS } from '../types';

interface UsageRecord {
  type: UsageType;
  amount: number;
  provider?: string;
  model?: string;
}

interface MonthlyUsage {
  llm_tokens: number;
  tts_characters: number;
  voice_clone: number;
}

export async function recordUsage(
  usage: UsageRecord,
  userId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('usage').insert({
    user_id: userId,
    type: usage.type,
    amount: usage.amount,
    provider: usage.provider ?? null,
    model: usage.model ?? null,
  });

  if (error) throw error;
}

export async function getMonthlyUsage(userId: string): Promise<MonthlyUsage> {
  const supabase = createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage')
    .select('type, amount')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) throw error;

  // Aggregate by type
  const usage: MonthlyUsage = {
    llm_tokens: 0,
    tts_characters: 0,
    voice_clone: 0,
  };

  for (const record of data ?? []) {
    if (record.type in usage) {
      usage[record.type as keyof MonthlyUsage] += record.amount;
    }
  }

  return usage;
}

export async function checkUsageLimit(
  userId: string,
  type: UsageType,
  tier: keyof typeof TIER_LIMITS
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
}> {
  const supabase = createClient();

  // Get current month usage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', startOfMonth.toISOString());

  if (error) throw error;

  const current = (data ?? []).reduce((sum, r) => sum + r.amount, 0);

  // Import tier limits
  const { TIER_LIMITS } = await import('../types');
  const tierLimits = TIER_LIMITS[tier];

  // Determine limit based on type
  let limit = -1; // -1 means unlimited
  if (type === 'llm_tokens') {
    // Convert message limit to approximate token limit (avg 1000 tokens per message)
    if (tierLimits.messages_per_month !== -1) {
      limit = tierLimits.messages_per_month * 1000;
    }
  } else if (type === 'tts_characters') {
    limit = tierLimits.voice_enabled ? -1 : 0;
  } else if (type === 'voice_clone') {
    limit = tierLimits.voice_enabled ? 5 : 0; // 5 clones per month for pro+
  }

  return {
    allowed: limit === -1 || current < limit,
    current,
    limit,
  };
}

export type Tier = 'free' | 'pro' | 'business';
export type Provider = 'anthropic' | 'openai' | 'ollama';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MemorySource = 'conversation' | 'manual' | 'system';
export type UsageType = 'llm_tokens' | 'tts_characters' | 'voice_clone';
export type Theme = 'light' | 'dark' | 'auto';
export type WidgetPosition = 'bottom-right' | 'bottom-left';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  tier: Tier;
  created_at: string;
  updated_at: string;
}

export interface Persona {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  system_prompt: string | null;
  voice_id: string | null;

  // Personality traits
  temperature: number;
  creativity: number;
  formality: number;
  humor: number;
  empathy: number;

  // LLM settings
  provider: Provider;
  model: string;
  max_tokens: number;

  is_public: boolean;
  is_template: boolean;

  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  persona_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tokens_used: number | null;
  created_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  persona_id: string | null;
  content: string;
  keywords: string[];
  importance: number;
  source: MemorySource;
  created_at: string;
}

export interface Usage {
  id: string;
  user_id: string;
  type: UsageType;
  amount: number;
  provider: string | null;
  model: string | null;
  period_start: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Embed {
  id: string;
  user_id: string;
  persona_id: string;
  name: string;
  allowed_origins: string[];
  theme: Theme;
  primary_color: string;
  position: WidgetPosition;
  welcome_message: string | null;
  is_active: boolean;
  rate_limit: number;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive' | 'incomplete' | 'incomplete_expired' | 'unpaid';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// Tier limits for usage tracking
export const TIER_LIMITS = {
  free: {
    messages_per_month: 100,
    personas: 1,
    voice_enabled: false,
    embeds: 0,
    api_access: false,
  },
  pro: {
    messages_per_month: -1, // Unlimited
    personas: 10,
    voice_enabled: true,
    embeds: 1,
    api_access: false,
  },
  business: {
    messages_per_month: -1, // Unlimited
    personas: -1, // Unlimited
    voice_enabled: true,
    embeds: -1, // Unlimited
    api_access: true,
  },
} as const;

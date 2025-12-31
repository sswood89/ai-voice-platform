export type Tier = 'free' | 'pro' | 'business';

export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRICE_PRO || '',
  business: process.env.STRIPE_PRICE_BUSINESS || '',
} as const;

export const TIER_PRICES: Record<Exclude<Tier, 'free'>, number> = {
  pro: 1900, // $19.00 in cents
  business: 4900, // $49.00 in cents
};

export const TIER_NAMES: Record<Tier, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
};

export function getPriceIdForTier(tier: Exclude<Tier, 'free'>): string {
  const priceId = STRIPE_PRICES[tier];
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for tier: ${tier}`);
  }
  return priceId;
}

export function getTierForPriceId(priceId: string): Tier {
  if (priceId === STRIPE_PRICES.pro) return 'pro';
  if (priceId === STRIPE_PRICES.business) return 'business';
  return 'free';
}

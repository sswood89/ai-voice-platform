import { createClient } from '@/lib/supabase/server';
import { getStripe } from './client';
import { getTierForPriceId, type Tier } from './prices';
import type Stripe from 'stripe';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching subscription:', error);
    throw error;
  }

  return data;
}

export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  const supabase = await createClient();

  // Check if user already has a subscription record with customer ID
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  // Create new Stripe customer
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: {
      user_id: userId,
    },
  });

  // Create or update subscription record with customer ID
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customer.id,
      status: 'inactive',
    }, {
      onConflict: 'user_id',
    });

  return customer.id;
}

export async function syncSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription,
  customerId: string
): Promise<void> {
  const supabase = await createClient();
  const stripe = getStripe();

  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    console.error('Customer has been deleted:', customerId);
    return;
  }

  const userId = customer.metadata.user_id;
  if (!userId) {
    console.error('No user_id in customer metadata:', customerId);
    return;
  }

  const priceId = stripeSubscription.items.data[0]?.price.id || null;
  const tier = priceId ? getTierForPriceId(priceId) : 'free';

  // Get current period from subscription (handle both old and new Stripe API formats)
  const currentPeriod = (stripeSubscription as { current_period?: { start: number; end: number } }).current_period;
  const periodStart = currentPeriod?.start
    ?? (stripeSubscription as unknown as { current_period_start?: number }).current_period_start;
  const periodEnd = currentPeriod?.end
    ?? (stripeSubscription as unknown as { current_period_end?: number }).current_period_end;

  // Update subscription record
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscription.id,
      stripe_price_id: priceId,
      status: stripeSubscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (subError) {
    console.error('Error updating subscription:', subError);
    throw subError;
  }

  // Update user tier based on subscription status
  const activeTier = ['active', 'trialing'].includes(stripeSubscription.status) ? tier : 'free';

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      tier: activeTier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile tier:', profileError);
    throw profileError;
  }
}

export async function handleSubscriptionDeleted(
  stripeSubscription: Stripe.Subscription,
  customerId: string
): Promise<void> {
  const supabase = await createClient();
  const stripe = getStripe();

  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    return;
  }

  const userId = customer.metadata.user_id;
  if (!userId) {
    return;
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  // Downgrade to free tier
  await supabase
    .from('profiles')
    .update({
      tier: 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

export async function cancelSubscription(userId: string): Promise<void> {
  const subscription = await getSubscription(userId);

  if (!subscription?.stripe_subscription_id) {
    throw new Error('No active subscription found');
  }

  const stripe = getStripe();

  // Cancel at period end (user keeps access until end of billing period)
  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  const supabase = await createClient();
  await supabase
    .from('subscriptions')
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

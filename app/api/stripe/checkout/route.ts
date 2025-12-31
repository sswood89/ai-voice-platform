import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';
import { getPriceIdForTier, type Tier } from '@/lib/stripe/prices';
import { getOrCreateCustomer } from '@/lib/stripe/subscription';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier } = await request.json();

    if (!tier || !['pro', 'business'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "pro" or "business"' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const priceId = getPriceIdForTier(tier as Exclude<Tier, 'free'>);

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(user.id, user.email!);

    // Check if customer already has an active subscription
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (existingSubscriptions.data.length > 0) {
      // Customer has active subscription - redirect to portal for upgrade/downgrade
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/settings/billing`,
      });

      return NextResponse.json({ url: portalSession.url });
    }

    // Create checkout session for new subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/settings/billing?canceled=true`,
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

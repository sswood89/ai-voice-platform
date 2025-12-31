import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return null subscription if Supabase isn't configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ subscription: null });
    }

    const { createClient } = await import('@/lib/supabase/server');
    const { getSubscription } = await import('@/lib/stripe/subscription');

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await getSubscription(user.id);

    return NextResponse.json({
      subscription: subscription
        ? {
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            stripe_price_id: subscription.stripe_price_id,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

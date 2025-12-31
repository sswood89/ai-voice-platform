'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, ExternalLink, AlertCircle } from 'lucide-react';

interface UsageData {
  tier: string;
  usage: {
    llm_tokens: number;
    tts_characters: number;
    voice_clones: number;
  };
  limits: {
    messages: { current: number; limit: number; unlimited: boolean };
    personas: { limit: number; unlimited: boolean };
    voice: { enabled: boolean };
    embeds: { limit: number; unlimited: boolean };
  };
}

interface SubscriptionData {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

const tiers = [
  {
    name: 'Free',
    id: 'free',
    price: 0,
    features: [
      '100 messages/month',
      '1 persona',
      'Basic LLM providers',
      'No voice features',
      'No embeddable widgets',
    ],
    limitations: ['No voice cloning', 'No widget embeds', 'No API access'],
  },
  {
    name: 'Pro',
    id: 'pro',
    price: 19,
    features: [
      'Unlimited messages',
      '10 personas',
      'All LLM providers',
      'Voice synthesis (ElevenLabs)',
      '5 voice clones/month',
      '1 embeddable widget',
    ],
    popular: true,
  },
  {
    name: 'Business',
    id: 'business',
    price: 49,
    features: [
      'Unlimited messages',
      'Unlimited personas',
      'All LLM providers',
      'Voice synthesis (ElevenLabs)',
      'Unlimited voice clones',
      'Unlimited widgets',
      'API access',
      'Priority support',
    ],
  },
];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    async function fetchData() {
      try {
        const [usageRes, subRes] = await Promise.all([
          fetch('/api/usage'),
          fetch('/api/subscription'),
        ]);

        if (usageRes.ok) {
          setUsage(await usageRes.json());
        }

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscription(subData.subscription);
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleCheckout = async (tier: string) => {
    setCheckoutLoading(tier);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" aria-hidden="true" />
        <span className="sr-only">Loading billing information...</span>
      </div>
    );
  }

  const currentTier = usage?.tier || 'free';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
        <p className="text-gray-600 mb-8">Manage your subscription and view usage</p>

        {/* Success/Cancel Messages */}
        {success && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
          >
            <Check className="h-5 w-5 text-green-600" aria-hidden="true" />
            <p className="text-green-800 font-medium">Your subscription has been activated successfully!</p>
          </div>
        )}

        {canceled && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <p className="text-amber-800 font-medium">Checkout was canceled. No charges were made.</p>
          </div>
        )}

        {/* Current Plan */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
              <p className="text-3xl font-bold text-indigo-600 mt-1 capitalize">{currentTier}</p>
              {subscription?.cancel_at_period_end && subscription.current_period_end && (
                <p className="text-sm text-amber-600 mt-1">
                  Cancels on {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            {currentTier !== 'free' && (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                aria-busy={portalLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                )}
                Manage Subscription
              </button>
            )}
          </div>

          {/* Usage Summary */}
          {usage && (
            <section className="mt-6 pt-6 border-t" aria-labelledby="usage-summary-heading">
              <h3 id="usage-summary-heading" className="sr-only">Usage Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600" id="messages-label">Messages This Month</p>
                <p className="text-xl font-semibold" aria-labelledby="messages-label">
                  {usage.limits.messages.unlimited
                    ? 'Unlimited'
                    : `${usage.limits.messages.current} / ${usage.limits.messages.limit}`}
                </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600" id="personas-label">Personas</p>
                  <p className="text-xl font-semibold" aria-labelledby="personas-label">
                    {usage.limits.personas.unlimited ? 'Unlimited' : usage.limits.personas.limit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600" id="voice-label">Voice</p>
                  <p className="text-xl font-semibold" aria-labelledby="voice-label">
                    {usage.limits.voice.enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600" id="embeds-label">Widget Embeds</p>
                  <p className="text-xl font-semibold" aria-labelledby="embeds-label">
                    {usage.limits.embeds.unlimited ? 'Unlimited' : usage.limits.embeds.limit}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Pricing Cards */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 relative ${
                tier.popular ? 'border-indigo-500' : 'border-transparent'
              } ${currentTier === tier.id ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-medium rounded-full">
                  Most Popular
                </span>
              )}

              <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-4xl font-bold">${tier.price}</span>
                {tier.price > 0 && <span className="text-gray-500">/month</span>}
              </div>

              <ul className="space-y-3 mb-6" aria-label={`${tier.name} plan features`}>
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {currentTier === tier.id ? (
                <button
                  disabled
                  aria-disabled="true"
                  className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg font-medium"
                >
                  Current Plan
                </button>
              ) : tier.id === 'free' ? (
                currentTier !== 'free' && (
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    aria-busy={portalLoading}
                    className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {portalLoading ? 'Loading...' : 'Downgrade'}
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleCheckout(tier.id)}
                  disabled={checkoutLoading !== null}
                  aria-busy={checkoutLoading === tier.id}
                  aria-label={`${currentTier === 'free' ? 'Get started with' : 'Upgrade to'} ${tier.name} plan at $${tier.price} per month`}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    tier.popular
                      ? 'bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-500'
                      : 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900'
                  }`}
                >
                  {checkoutLoading === tier.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Loading...
                    </span>
                  ) : currentTier === 'free' ? (
                    'Get Started'
                  ) : (
                    'Upgrade'
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* FAQ or Help */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>
            Questions about billing?{' '}
            <a href="mailto:support@example.com" className="text-indigo-500 hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface Tier {
  name: string;
  id: string;
  price: number;
  features: string[];
  popular?: boolean;
}

interface PricingCardsProps {
  currentTier: string;
  onSelectTier: (tierId: string) => Promise<void>;
}

const tiers: Tier[] = [
  {
    name: 'Free',
    id: 'free',
    price: 0,
    features: [
      '100 messages/month',
      '1 persona',
      'Basic LLM providers',
    ],
  },
  {
    name: 'Pro',
    id: 'pro',
    price: 19,
    features: [
      'Unlimited messages',
      '10 personas',
      'All LLM providers',
      'Voice synthesis',
      '5 voice clones/month',
      '1 widget embed',
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
      'Voice synthesis',
      'Unlimited voice clones',
      'Unlimited widgets',
      'API access',
      'Priority support',
    ],
  },
];

export function PricingCards({ currentTier, onSelectTier }: PricingCardsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (tierId: string) => {
    if (tierId === currentTier || tierId === 'free') return;

    setLoading(tierId);
    try {
      await onSelectTier(tierId);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={`bg-white rounded-xl shadow-sm border-2 p-6 relative ${
            tier.popular ? 'border-indigo-500' : 'border-gray-200'
          } ${currentTier === tier.id ? 'ring-2 ring-indigo-500' : ''}`}
        >
          {tier.popular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-medium rounded-full">
              Popular
            </span>
          )}

          <h3 className="text-lg font-semibold">{tier.name}</h3>
          <div className="mt-2 mb-4">
            <span className="text-4xl font-bold">${tier.price}</span>
            {tier.price > 0 && <span className="text-gray-500">/mo</span>}
          </div>

          <ul className="space-y-2 mb-6">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSelect(tier.id)}
            disabled={currentTier === tier.id || loading !== null}
            className={`w-full py-2 px-4 rounded-lg font-medium transition ${
              currentTier === tier.id
                ? 'bg-gray-100 text-gray-500 cursor-default'
                : tier.popular
                ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            } disabled:opacity-50`}
          >
            {loading === tier.id ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : currentTier === tier.id ? (
              'Current'
            ) : (
              'Select'
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

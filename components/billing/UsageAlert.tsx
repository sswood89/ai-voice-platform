'use client';

import { AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UsageAlertProps {
  current: number;
  limit: number;
  type: 'messages' | 'personas' | 'embeds';
  threshold?: number; // Show alert when usage exceeds this percentage (default 80%)
}

const typeLabels: Record<string, string> = {
  messages: 'messages',
  personas: 'personas',
  embeds: 'widget embeds',
};

export function UsageAlert({ current, limit, type, threshold = 80 }: UsageAlertProps) {
  const percentage = (current / limit) * 100;

  if (percentage < threshold) {
    return null;
  }

  const isAtLimit = current >= limit;

  return (
    <div
      className={`rounded-lg p-4 flex items-start gap-3 ${
        isAtLimit
          ? 'bg-red-50 border border-red-200'
          : 'bg-amber-50 border border-amber-200'
      }`}
    >
      <AlertTriangle
        className={`h-5 w-5 shrink-0 ${isAtLimit ? 'text-red-500' : 'text-amber-500'}`}
      />
      <div className="flex-1">
        <p className={`font-medium ${isAtLimit ? 'text-red-800' : 'text-amber-800'}`}>
          {isAtLimit
            ? `You've reached your ${typeLabels[type]} limit`
            : `You're approaching your ${typeLabels[type]} limit`}
        </p>
        <p className={`text-sm mt-1 ${isAtLimit ? 'text-red-700' : 'text-amber-700'}`}>
          {current} of {limit} {typeLabels[type]} used ({Math.round(percentage)}%)
        </p>
        <Link
          href="/settings/billing"
          className={`inline-flex items-center gap-1 text-sm font-medium mt-2 ${
            isAtLimit
              ? 'text-red-600 hover:text-red-700'
              : 'text-amber-600 hover:text-amber-700'
          }`}
        >
          Upgrade your plan
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// Inline variant for showing in headers/nav
export function UsageAlertBadge({
  current,
  limit,
  threshold = 90,
}: Omit<UsageAlertProps, 'type'>) {
  const percentage = (current / limit) * 100;

  if (percentage < threshold) {
    return null;
  }

  const isAtLimit = current >= limit;

  return (
    <Link
      href="/settings/billing"
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
        isAtLimit
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
      }`}
    >
      <AlertTriangle className="h-3 w-3" />
      {isAtLimit ? 'Limit reached' : `${Math.round(percentage)}% used`}
    </Link>
  );
}

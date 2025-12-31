'use client';

/**
 * ElevenLabs Usage Display
 * Shows character usage and voice limits
 */

import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, Volume2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SubscriptionInfo {
  characterCount: number;
  characterLimit: number;
  voiceCount: number;
  voiceLimit: number;
  canClone: boolean;
  tier: string;
  nextResetDate: string | null;
}

export function ElevenLabsUsage() {
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/voices/subscription');
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch subscription');
        }
        const data = await response.json();
        setInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading usage...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-muted-foreground">
        Configure ElevenLabs API key to view usage
      </div>
    );
  }

  if (!info) return null;

  const usagePercent = info.characterLimit > 0
    ? (info.characterCount / info.characterLimit) * 100
    : 0;

  const isLow = usagePercent > 80;
  const isExhausted = usagePercent >= 100;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatResetDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">ElevenLabs Usage</span>
        <span className="text-xs text-muted-foreground capitalize">({info.tier})</span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Characters</span>
          <span className={isLow ? 'text-orange-500' : ''}>
            {formatNumber(info.characterCount)} / {formatNumber(info.characterLimit)}
          </span>
        </div>
        <Progress
          value={Math.min(usagePercent, 100)}
          className={isExhausted ? 'bg-red-100' : isLow ? 'bg-orange-100' : ''}
        />
        {isLow && !isExhausted && (
          <div className="flex items-center gap-1 text-xs text-orange-500">
            <AlertTriangle className="h-3 w-3" />
            Running low on characters
          </div>
        )}
        {isExhausted && (
          <div className="flex items-center gap-1 text-xs text-red-500">
            <AlertTriangle className="h-3 w-3" />
            Character limit reached
          </div>
        )}
        {info.nextResetDate && (
          <p className="text-xs text-muted-foreground">
            Resets {formatResetDate(info.nextResetDate)}
          </p>
        )}
      </div>

      <div className="flex justify-between text-sm">
        <span>Voices</span>
        <span>{info.voiceCount} / {info.voiceLimit}</span>
      </div>

      {!info.canClone && (
        <p className="text-xs text-muted-foreground">
          Upgrade your ElevenLabs plan to enable voice cloning
        </p>
      )}
    </div>
  );
}

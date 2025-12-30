'use client';

/**
 * MemoryIndicator Component
 * Shows active memories being used in conversation context
 */

import { useState } from 'react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Memory } from '@/types';

interface MemoryIndicatorProps {
  memories: Memory[];
}

export function MemoryIndicator({ memories }: MemoryIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (memories.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs gap-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Brain className="h-3 w-3 text-purple-500" />
        <span className="text-muted-foreground">
          {memories.length} {memories.length === 1 ? 'memory' : 'memories'} active
        </span>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </Button>

      {isExpanded && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-popover border rounded-lg shadow-lg p-3 z-50">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            Active Memories
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {memories.map((memory, index) => (
              <div
                key={memory.id}
                className="text-xs p-2 bg-muted rounded-md"
              >
                <p className="text-foreground mb-1">{memory.summary}</p>
                <div className="flex flex-wrap gap-1">
                  {memory.topics.map((topic) => (
                    <Badge
                      key={topic}
                      variant="secondary"
                      className="text-[10px] px-1 py-0"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            These memories provide context from previous conversations.
          </p>
        </div>
      )}
    </div>
  );
}

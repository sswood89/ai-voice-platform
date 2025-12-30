'use client';

/**
 * MessageList Component
 * Displays chat message history with auto-scroll
 */

import { useRef, useEffect } from 'react';
import { User, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { ChatMessage } from '@/types';
import { clsx } from 'clsx';

interface MessageListProps {
  messages: ChatMessage[];
  streamingContent?: string;
  streamingMessageId?: string;
}

export function MessageList({
  messages,
  streamingContent,
  streamingMessageId,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Bot className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Send a message to begin chatting. Select a persona to customize the AI&apos;s personality and voice.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((message) => {
          const isStreaming = message.id === streamingMessageId;
          const displayContent = isStreaming
            ? streamingContent || message.content
            : message.content;

          return (
            <div
              key={message.id}
              className={clsx(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className={clsx(
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div
                className={clsx(
                  'flex flex-col max-w-[80%]',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={clsx(
                    'rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {displayContent || (
                      <span className="animate-pulse">●●●</span>
                    )}
                  </p>
                </div>

                <span className="text-xs text-muted-foreground mt-1">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

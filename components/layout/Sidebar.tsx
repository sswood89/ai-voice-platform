'use client';

/**
 * Sidebar Component
 * Navigation and conversation list
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Users,
  Mic,
  Settings,
  Plus,
  Trash2,
  LayoutDashboard,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/stores';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Personas', href: '/personas', icon: Users },
  { name: 'Voices', href: '/voices', icon: Mic },
  { name: 'Billing', href: '/settings/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const {
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    setActiveConversation,
  } = useChatStore();

  return (
    <div className="flex flex-col h-full w-64 border-r bg-muted/30">
      {/* Logo */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">AI Voice Platform</h1>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1" aria-label="Main navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href} aria-current={isActive ? 'page' : undefined}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={clsx('w-full justify-start', isActive && 'bg-secondary')}
              >
                <item.icon className="h-4 w-4 mr-2" aria-hidden="true" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Conversations */}
      {pathname === '/chat' && (
        <>
          <div className="px-4 py-2 border-t border-b flex items-center justify-between">
            <span className="text-sm font-medium" id="conversations-heading">Conversations</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              aria-label="Create new conversation"
              onClick={() => createConversation()}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <ul className="p-2 space-y-1" role="listbox" aria-labelledby="conversations-heading">
              {conversations.map((conversation) => {
                const title = conversation.title || 'New Conversation';
                const isActive = activeConversationId === conversation.id;
                return (
                  <li
                    key={conversation.id}
                    role="option"
                    aria-selected={isActive}
                    tabIndex={0}
                    className={clsx(
                      'group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer',
                      'hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
                      isActive && 'bg-accent'
                    )}
                    onClick={() => setActiveConversation(conversation.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveConversation(conversation.id);
                      }
                    }}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm truncate flex-1">
                      {title}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100"
                      aria-label={`Delete conversation: ${title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}

              {conversations.length === 0 && (
                <li className="text-sm text-muted-foreground text-center py-4" role="status">
                  No conversations yet
                </li>
              )}
            </ul>
          </ScrollArea>
        </>
      )}
    </div>
  );
}

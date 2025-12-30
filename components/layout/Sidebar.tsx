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
      <nav className="p-2 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={clsx('w-full justify-start', isActive && 'bg-secondary')}
              >
                <item.icon className="h-4 w-4 mr-2" />
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
            <span className="text-sm font-medium">Conversations</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => createConversation()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={clsx(
                    'group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer',
                    'hover:bg-accent transition-colors',
                    activeConversationId === conversation.id && 'bg-accent'
                  )}
                  onClick={() => setActiveConversation(conversation.id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate flex-1">
                    {conversation.title || 'New Conversation'}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {conversations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No conversations yet
                </p>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}

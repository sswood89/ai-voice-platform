'use client';

/**
 * Chat Page
 * Main chat interface with persona selection
 */

import { ChatInterface } from '@/components/chat';
import { usePersonaStore } from '@/stores';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users } from 'lucide-react';

export default function ChatPage() {
  const { personas, activePersonaId, setActivePersona, getActivePersona } = usePersonaStore();
  const activePersona = getActivePersona();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-muted-foreground" />
          <Select
            value={activePersonaId ?? 'none'}
            onValueChange={(value) =>
              setActivePersona(value === 'none' ? null : value)
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a persona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No persona (default)</SelectItem>
              {personas.map((persona) => (
                <SelectItem key={persona.id} value={persona.id}>
                  {persona.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activePersona && (
          <p className="text-sm text-muted-foreground">
            {activePersona.personality.traits.slice(0, 3).join(' • ')}
          </p>
        )}
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}

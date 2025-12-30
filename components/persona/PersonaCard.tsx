'use client';

/**
 * PersonaCard Component
 * Displays a persona in the library
 */

import { Bot, Volume2, Edit2, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Persona } from '@/types';
import { clsx } from 'clsx';

interface PersonaCardProps {
  persona: Persona;
  isActive?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export function PersonaCard({
  persona,
  isActive = false,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
}: PersonaCardProps) {
  const modeLabels: Record<string, string> = {
    assistant: 'Assistant',
    content: 'Content',
    developer: 'Developer',
    customer_service: 'Support',
  };

  return (
    <Card
      className={clsx(
        'cursor-pointer transition-all hover:shadow-md',
        isActive && 'ring-2 ring-primary'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {persona.avatar ? (
                <AvatarImage src={persona.avatar} alt={persona.name} />
              ) : null}
              <AvatarFallback>
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{persona.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {modeLabels[persona.behavior.mode]}
                </Badge>
                {persona.voice.voiceId && (
                  <Volume2 className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {onDuplicate && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onDuplicate}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onEdit}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="line-clamp-2">
          {persona.description}
        </CardDescription>

        {persona.personality.traits.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {persona.personality.traits.slice(0, 3).map((trait) => (
              <Badge key={trait} variant="outline" className="text-xs">
                {trait}
              </Badge>
            ))}
            {persona.personality.traits.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{persona.personality.traits.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

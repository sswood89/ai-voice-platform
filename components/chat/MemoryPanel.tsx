'use client';

/**
 * Memory Panel
 * View and manage memories for a persona
 */

import { useState } from 'react';
import { Brain, Trash2, ChevronDown, ChevronUp, Calendar, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useMemoryStore, usePersonaStore } from '@/stores';
import type { Memory } from '@/types';

interface MemoryPanelProps {
  personaId?: string;
  trigger?: React.ReactNode;
}

export function MemoryPanel({ personaId, trigger }: MemoryPanelProps) {
  const [expandedMemories, setExpandedMemories] = useState<Set<string>>(new Set());
  const { memories, deleteMemory, clearPersonaMemories } = useMemoryStore();
  const { personas } = usePersonaStore();

  const filteredMemories = personaId
    ? memories.filter((m) => m.personaId === personaId)
    : memories;

  const groupedMemories = filteredMemories.reduce((acc, memory) => {
    const key = memory.personaId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(memory);
    return acc;
  }, {} as Record<string, Memory[]>);

  const toggleExpand = (memoryId: string) => {
    const newExpanded = new Set(expandedMemories);
    if (newExpanded.has(memoryId)) {
      newExpanded.delete(memoryId);
    } else {
      newExpanded.add(memoryId);
    }
    setExpandedMemories(newExpanded);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getPersonaName = (pId: string) => {
    const persona = personas.find((p) => p.id === pId);
    return persona?.name || 'Unknown Persona';
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Brain className="h-4 w-4 mr-2" />
      Memories ({filteredMemories.length})
    </Button>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Memory Bank
          </SheetTitle>
          <SheetDescription>
            {personaId
              ? `${filteredMemories.length} memories stored for this persona`
              : `${filteredMemories.length} total memories across all personas`}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] mt-4 pr-4">
          {filteredMemories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No memories stored yet</p>
              <p className="text-sm mt-2">
                Memories are created automatically after 15+ messages in a conversation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {personaId ? (
                // Single persona view
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {filteredMemories.length} memories
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Clear All
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear all memories?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all {filteredMemories.length} memories for
                            this persona. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => clearPersonaMemories(personaId)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete All
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {filteredMemories
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .map((memory) => (
                      <MemoryCard
                        key={memory.id}
                        memory={memory}
                        isExpanded={expandedMemories.has(memory.id)}
                        onToggle={() => toggleExpand(memory.id)}
                        onDelete={() => deleteMemory(memory.id)}
                        formatDate={formatDate}
                      />
                    ))}
                </>
              ) : (
                // All personas view
                Object.entries(groupedMemories)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([pId, mems]) => (
                    <div key={pId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{getPersonaName(pId)}</h3>
                        <Badge variant="secondary">{mems.length}</Badge>
                      </div>
                      {mems
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        )
                        .slice(0, 3)
                        .map((memory) => (
                          <MemoryCard
                            key={memory.id}
                            memory={memory}
                            isExpanded={expandedMemories.has(memory.id)}
                            onToggle={() => toggleExpand(memory.id)}
                            onDelete={() => deleteMemory(memory.id)}
                            formatDate={formatDate}
                            compact
                          />
                        ))}
                      {mems.length > 3 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{mems.length - 3} more memories
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface MemoryCardProps {
  memory: Memory;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  formatDate: (date: Date) => string;
  compact?: boolean;
}

function MemoryCard({
  memory,
  isExpanded,
  onToggle,
  onDelete,
  formatDate,
  compact,
}: MemoryCardProps) {
  return (
    <Card className={compact ? 'bg-muted/50' : ''}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <button
              onClick={onToggle}
              className="w-full text-left flex items-start gap-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 mt-0.5 flex-shrink-0" />
              )}
              <span className={`text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
                {memory.summary}
              </span>
            </button>

            {isExpanded && (
              <div className="mt-3 pl-6 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(memory.createdAt)}
                </div>
                {memory.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {memory.topics.map((topic) => (
                      <Badge key={topic} variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {memory.messageRange.count} messages summarized
                </p>
              </div>
            )}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                <X className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete memory?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this memory. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

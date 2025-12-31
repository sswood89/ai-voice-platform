'use client';

/**
 * CreatePersonaPrompt Component
 * Shown after successful voice cloning to optionally create a persona
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, User, ArrowRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePersonaStore } from '@/stores';
import { toast } from 'sonner';

interface CreatePersonaPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voiceId: string;
  voiceName: string;
}

export function CreatePersonaPrompt({
  open,
  onOpenChange,
  voiceId,
  voiceName,
}: CreatePersonaPromptProps) {
  const router = useRouter();
  const { addPersona } = usePersonaStore();
  const [mode, setMode] = useState<'prompt' | 'quick-create'>('prompt');
  const [personaName, setPersonaName] = useState('');
  const [personaDescription, setPersonaDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleQuickCreate = async () => {
    if (!personaName.trim()) {
      toast.error('Please enter a persona name');
      return;
    }

    setIsCreating(true);
    try {
      const newPersona = {
        id: crypto.randomUUID(),
        name: personaName.trim(),
        description: personaDescription.trim() || `Persona using the ${voiceName} voice`,
        systemPrompt: `You are ${personaName}, a helpful AI assistant. Speak naturally and be conversational.`,
        voice: {
          voiceId: voiceId,
          stability: 0.5,
          similarityBoost: 0.75,
        },
        llmProvider: 'anthropic' as const,
        llmModel: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        maxTokens: 2048,
        memoryEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addPersona(newPersona);
      toast.success(`Persona "${personaName}" created with ${voiceName} voice!`);
      handleClose();
      router.push('/personas');
    } catch (error) {
      toast.error('Failed to create persona');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGoToPersonas = () => {
    handleClose();
    router.push(`/personas?voiceId=${voiceId}&voiceName=${encodeURIComponent(voiceName)}`);
  };

  const handleClose = () => {
    setMode('prompt');
    setPersonaName('');
    setPersonaDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        {mode === 'prompt' ? (
          <>
            <DialogHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-center">Voice Created Successfully!</DialogTitle>
              <DialogDescription className="text-center">
                Your voice "{voiceName}" has been cloned and is ready to use.
                Would you like to create a persona using this voice?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <Button
                className="w-full justify-between h-auto py-4"
                variant="outline"
                onClick={() => setMode('quick-create')}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Quick Create Persona</p>
                    <p className="text-xs text-muted-foreground">
                      Create a basic persona with this voice now
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>

              <Button
                className="w-full justify-between h-auto py-4"
                variant="outline"
                onClick={handleGoToPersonas}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Full Persona Editor</p>
                    <p className="text-xs text-muted-foreground">
                      Customize all settings in the persona editor
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose} className="w-full">
                Maybe Later
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Quick Create Persona</DialogTitle>
              <DialogDescription>
                Create a persona using the "{voiceName}" voice
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="persona-name">Persona Name *</Label>
                <Input
                  id="persona-name"
                  value={personaName}
                  onChange={(e) => setPersonaName(e.target.value)}
                  placeholder="e.g., Alex, Customer Support Bot"
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="persona-description">Description</Label>
                <Textarea
                  id="persona-description"
                  value={personaDescription}
                  onChange={(e) => setPersonaDescription(e.target.value)}
                  placeholder="Brief description of this persona (optional)"
                  rows={2}
                  maxLength={200}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">
                  <strong>Voice:</strong> {voiceName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can customize the system prompt and other settings later in the persona editor.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setMode('prompt')}>
                Back
              </Button>
              <Button onClick={handleQuickCreate} disabled={isCreating || !personaName.trim()}>
                {isCreating ? 'Creating...' : 'Create Persona'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

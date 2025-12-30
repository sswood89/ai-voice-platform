'use client';

/**
 * PersonalityEditor Component
 * Configure personality traits, tone, style, and custom instructions
 */

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUGGESTED_TRAITS } from '@/lib/persona';
import type { PersonaPersonalityConfig, PersonaMode, PersonaTone, PersonaStyle } from '@/types';

interface PersonalityEditorProps {
  personality: PersonaPersonalityConfig;
  mode: PersonaMode;
  onChange: (personality: PersonaPersonalityConfig) => void;
}

const TONES: { value: PersonaTone; label: string; description: string }[] = [
  { value: 'casual', label: 'Casual', description: 'Friendly and relaxed' },
  { value: 'formal', label: 'Formal', description: 'Professional and polished' },
  { value: 'playful', label: 'Playful', description: 'Fun and energetic' },
  { value: 'authoritative', label: 'Authoritative', description: 'Confident and expert' },
];

const STYLES: { value: PersonaStyle; label: string; description: string }[] = [
  { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
  { value: 'detailed', label: 'Detailed', description: 'Thorough explanations' },
  { value: 'conversational', label: 'Conversational', description: 'Natural dialogue flow' },
];

export function PersonalityEditor({ personality, mode, onChange }: PersonalityEditorProps) {
  const [newTrait, setNewTrait] = useState('');

  const suggestedTraits = SUGGESTED_TRAITS[mode] || SUGGESTED_TRAITS.assistant;
  const availableSuggestions = suggestedTraits.filter(
    (trait) => !personality.traits.includes(trait)
  );

  const addTrait = (trait: string) => {
    const trimmed = trait.trim().toLowerCase();
    if (trimmed && !personality.traits.includes(trimmed)) {
      onChange({
        ...personality,
        traits: [...personality.traits, trimmed],
      });
    }
    setNewTrait('');
  };

  const removeTrait = (trait: string) => {
    onChange({
      ...personality,
      traits: personality.traits.filter((t) => t !== trait),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTrait(newTrait);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personality Traits */}
      <Card>
        <CardHeader>
          <CardTitle>Personality Traits</CardTitle>
          <CardDescription>
            Add traits that define how your persona communicates and behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Traits */}
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {personality.traits.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No traits added yet. Add some below!
              </p>
            ) : (
              personality.traits.map((trait) => (
                <Badge
                  key={trait}
                  variant="secondary"
                  className="px-3 py-1 text-sm cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeTrait(trait)}
                >
                  {trait}
                  <X className="h-3 w-3 ml-2" />
                </Badge>
              ))
            )}
          </div>

          {/* Add Custom Trait */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a custom trait..."
              value={newTrait}
              onChange={(e) => setNewTrait(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={30}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => addTrait(newTrait)}
              disabled={!newTrait.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Suggested Traits */}
          {availableSuggestions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Suggested traits:</Label>
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.slice(0, 6).map((trait) => (
                  <Badge
                    key={trait}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => addTrait(trait)}
                  >
                    + {trait}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tone & Style */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Style</CardTitle>
          <CardDescription>
            Define how your persona speaks and presents information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tone */}
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select
              value={personality.tone}
              onValueChange={(value) =>
                onChange({ ...personality, tone: value as PersonaTone })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((tone) => (
                  <SelectItem key={tone.value} value={tone.value}>
                    <div className="flex flex-col">
                      <span>{tone.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {tone.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <Label>Response Style</Label>
            <Select
              value={personality.style}
              onValueChange={(value) =>
                onChange({ ...personality, style: value as PersonaStyle })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    <div className="flex flex-col">
                      <span>{style.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {style.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Custom Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Instructions</CardTitle>
          <CardDescription>
            Add specific instructions or guidelines for your persona (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., Always greet users by name, use bullet points for lists, avoid technical jargon..."
            value={personality.customInstructions ?? ''}
            onChange={(e) =>
              onChange({ ...personality, customInstructions: e.target.value || undefined })
            }
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {(personality.customInstructions ?? '').length}/1000 characters
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

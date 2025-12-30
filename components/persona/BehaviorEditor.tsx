'use client';

/**
 * BehaviorEditor Component
 * Configure mode, response settings, and behavior toggles
 */

import { Bot, PenTool, Code, Headphones, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PersonaBehaviorConfig, PersonaMode, ResponseLength } from '@/types';

interface BehaviorEditorProps {
  behavior: PersonaBehaviorConfig;
  onChange: (behavior: PersonaBehaviorConfig) => void;
}

const MODES: { value: PersonaMode; label: string; icon: typeof Bot; description: string }[] = [
  {
    value: 'assistant',
    label: 'Assistant',
    icon: Bot,
    description: 'General help and task assistance',
  },
  {
    value: 'content',
    label: 'Content Creator',
    icon: PenTool,
    description: 'Writing, creativity, and content generation',
  },
  {
    value: 'developer',
    label: 'Developer',
    icon: Code,
    description: 'Code help, reviews, and technical guidance',
  },
  {
    value: 'customer_service',
    label: 'Customer Service',
    icon: Headphones,
    description: 'Support, issue resolution, and customer care',
  },
];

const RESPONSE_LENGTHS: { value: ResponseLength; label: string; description: string }[] = [
  { value: 'short', label: 'Short', description: 'Brief, direct answers' },
  { value: 'medium', label: 'Medium', description: 'Balanced responses' },
  { value: 'long', label: 'Long', description: 'Detailed explanations' },
];

export function BehaviorEditor({ behavior, onChange }: BehaviorEditorProps) {
  const updateBehavior = <K extends keyof PersonaBehaviorConfig>(
    key: K,
    value: PersonaBehaviorConfig[K]
  ) => {
    onChange({ ...behavior, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Persona Mode</CardTitle>
          <CardDescription>
            Select the primary purpose of this persona
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = behavior.mode === mode.value;

              return (
                <div
                  key={mode.value}
                  onClick={() => updateBehavior('mode', mode.value)}
                  className={`
                    relative p-4 rounded-lg border cursor-pointer
                    transition-all hover:border-primary/50
                    ${isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border'
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                        p-2 rounded-lg
                        ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                      `}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{mode.label}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Response Length */}
      <Card>
        <CardHeader>
          <CardTitle>Response Length</CardTitle>
          <CardDescription>
            Set the default length of responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {RESPONSE_LENGTHS.map((length) => (
              <button
                key={length.value}
                onClick={() => updateBehavior('responseLength', length.value)}
                className={`
                  flex-1 p-3 rounded-lg border text-center transition-all
                  hover:border-primary/50
                  ${behavior.responseLength === length.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                  }
                `}
              >
                <span className="font-medium block">{length.label}</span>
                <span className="text-xs text-muted-foreground">
                  {length.description}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Behavior Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Behavior Settings</CardTitle>
          <CardDescription>
            Fine-tune how your persona interacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Use Emoji */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Use Emoji</Label>
              <p className="text-sm text-muted-foreground">
                Include emoji in responses for a friendlier feel
              </p>
            </div>
            <Switch
              checked={behavior.useEmoji}
              onCheckedChange={(checked) => updateBehavior('useEmoji', checked)}
            />
          </div>

          {/* Acknowledge Uncertainty */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Acknowledge Uncertainty</Label>
              <p className="text-sm text-muted-foreground">
                Admit when unsure rather than guessing
              </p>
            </div>
            <Switch
              checked={behavior.acknowledgeUncertainty}
              onCheckedChange={(checked) =>
                updateBehavior('acknowledgeUncertainty', checked)
              }
            />
          </div>

          {/* Ask Clarifying Questions */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ask Clarifying Questions</Label>
              <p className="text-sm text-muted-foreground">
                Ask for more details when requests are ambiguous
              </p>
            </div>
            <Switch
              checked={behavior.askClarifyingQuestions}
              onCheckedChange={(checked) =>
                updateBehavior('askClarifyingQuestions', checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

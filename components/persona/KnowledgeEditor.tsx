'use client';

/**
 * KnowledgeEditor Component
 * Configure domain expertise, context, and background information
 */

import { BookOpen, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PersonaKnowledgeConfig } from '@/types';

interface KnowledgeEditorProps {
  knowledge: PersonaKnowledgeConfig;
  onChange: (knowledge: PersonaKnowledgeConfig) => void;
}

const DOMAIN_EXAMPLES = [
  'Software development and programming',
  'Creative writing and storytelling',
  'Customer support and issue resolution',
  'Marketing and social media',
  'Data analysis and visualization',
  'Health and wellness coaching',
];

export function KnowledgeEditor({ knowledge, onChange }: KnowledgeEditorProps) {
  const updateKnowledge = <K extends keyof PersonaKnowledgeConfig>(
    key: K,
    value: PersonaKnowledgeConfig[K]
  ) => {
    onChange({ ...knowledge, [key]: value || undefined });
  };

  return (
    <div className="space-y-6">
      {/* Domain Expertise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Domain Expertise
          </CardTitle>
          <CardDescription>
            What area of expertise should this persona have?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Area of Expertise</Label>
            <Input
              id="domain"
              placeholder="e.g., Software development and best practices"
              value={knowledge.domain ?? ''}
              onChange={(e) => updateKnowledge('domain', e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Quick suggestions */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick suggestions:</Label>
            <div className="flex flex-wrap gap-2">
              {DOMAIN_EXAMPLES.map((example) => (
                <button
                  key={example}
                  onClick={() => updateKnowledge('domain', example)}
                  className={`
                    text-xs px-2 py-1 rounded border transition-colors
                    hover:bg-muted
                    ${knowledge.domain === example ? 'bg-primary/10 border-primary' : ''}
                  `}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Background Context
          </CardTitle>
          <CardDescription>
            Provide additional context or background information the persona should know
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="context">Context Information</Label>
            <Textarea
              id="context"
              placeholder="Add background information, specific knowledge, or context that will help this persona respond more effectively...

Example: This persona assists users of our SaaS product. Key features include task management, team collaboration, and time tracking. Our customers are primarily small business owners and freelancers."
              value={knowledge.context ?? ''}
              onChange={(e) => updateKnowledge('context', e.target.value)}
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {(knowledge.context ?? '').length}/2000 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Knowledge Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Be specific:</strong> Instead of "technology", specify "React and TypeScript web development"
          </p>
          <p>
            <strong>Add context:</strong> Include relevant background about your use case, audience, or product
          </p>
          <p>
            <strong>Keep it focused:</strong> Too much information can dilute the persona's effectiveness
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

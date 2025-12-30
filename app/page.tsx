'use client';

/**
 * Dashboard Page
 * Overview of personas, conversations, and quick actions
 */

import Link from 'next/link';
import {
  MessageSquare,
  Users,
  Mic,
  ArrowRight,
  Bot,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useChatStore, usePersonaStore, useVoiceStore } from '@/stores';
import { PERSONA_TEMPLATES } from '@/lib/persona';

export default function DashboardPage() {
  const conversations = useChatStore((s) => s.conversations);
  const personas = usePersonaStore((s) => s.personas);
  const voices = useVoiceStore((s) => s.voices);

  const stats = [
    {
      title: 'Conversations',
      value: conversations.length,
      icon: MessageSquare,
      href: '/chat',
    },
    {
      title: 'Personas',
      value: personas.length,
      icon: Users,
      href: '/personas',
    },
    {
      title: 'Voices',
      value: voices.length,
      icon: Mic,
      href: '/voices',
    },
  ];

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div>
        <h1 className="text-3xl font-bold">Welcome to AI Voice Platform</h1>
        <p className="text-muted-foreground mt-2">
          Create AI personas with custom voices and chat with them using multiple LLM providers.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Start Chatting
            </CardTitle>
            <CardDescription>
              Begin a conversation with an AI persona
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/chat">
              <Button className="w-full">
                New Conversation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Create Persona
            </CardTitle>
            <CardDescription>
              Build a custom AI personality with voice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/personas/new">
              <Button variant="outline" className="w-full">
                Create New Persona
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Start Templates</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PERSONA_TEMPLATES.slice(0, 3).map((template) => (
            <Card key={template.templateId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {template.personality.traits.slice(0, 3).map((trait) => (
                    <span
                      key={trait}
                      className="text-xs bg-secondary px-2 py-1 rounded"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Platform Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-medium">Multi-Provider LLM</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Anthropic Claude, OpenAI GPT, and local Ollama models
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-medium">Voice Cloning</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Clone any voice with ElevenLabs integration
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-medium">Persona System</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Customize personality, tone, and behavior
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-medium">Multiple Modes</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Assistant, content, developer, and support modes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

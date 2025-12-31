'use client';

/**
 * Settings Page
 * Configure API keys, LLM providers, and preferences
 */

import { useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsStore } from '@/stores';
import { ElevenLabsUsage } from '@/components/settings/ElevenLabsUsage';
import { ANTHROPIC_MODELS, OPENAI_MODELS, OLLAMA_MODELS } from '@/types';
import { toast } from 'sonner';

export default function SettingsPage() {
  const settings = useSettingsStore();
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const models =
    settings.provider === 'anthropic'
      ? ANTHROPIC_MODELS
      : settings.provider === 'openai'
      ? OPENAI_MODELS
      : OLLAMA_MODELS;

  const handleSave = () => {
    toast.success('Settings saved');
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your API keys and preferences
        </p>
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Connect your AI and voice services. Keys are stored securely in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ElevenLabs */}
          <div className="space-y-2">
            <Label htmlFor="elevenlabs">ElevenLabs API Key</Label>
            <div className="flex gap-2">
              <Input
                id="elevenlabs"
                type={showApiKeys.elevenlabs ? 'text' : 'password'}
                placeholder="Enter your ElevenLabs API key"
                value={settings.apiKeys.elevenlabs ?? ''}
                onChange={(e) => settings.setApiKey('elevenlabs', e.target.value)}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setShowApiKeys((s) => ({ ...s, elevenlabs: !s.elevenlabs }))
                }
              >
                {showApiKeys.elevenlabs ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Required for text-to-speech and voice cloning
            </p>
          </div>

          <Separator />

          {/* Anthropic */}
          <div className="space-y-2">
            <Label htmlFor="anthropic">Anthropic API Key</Label>
            <div className="flex gap-2">
              <Input
                id="anthropic"
                type={showApiKeys.anthropic ? 'text' : 'password'}
                placeholder="Enter your Anthropic API key"
                value={settings.apiKeys.anthropic ?? ''}
                onChange={(e) => settings.setApiKey('anthropic', e.target.value)}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setShowApiKeys((s) => ({ ...s, anthropic: !s.anthropic }))
                }
              >
                {showApiKeys.anthropic ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Required for Claude models
            </p>
          </div>

          {/* OpenAI */}
          <div className="space-y-2">
            <Label htmlFor="openai">OpenAI API Key</Label>
            <div className="flex gap-2">
              <Input
                id="openai"
                type={showApiKeys.openai ? 'text' : 'password'}
                placeholder="Enter your OpenAI API key"
                value={settings.apiKeys.openai ?? ''}
                onChange={(e) => settings.setApiKey('openai', e.target.value)}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setShowApiKeys((s) => ({ ...s, openai: !s.openai }))
                }
              >
                {showApiKeys.openai ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Required for GPT models
            </p>
          </div>
        </CardContent>
      </Card>

      {/* LLM Settings */}
      <Card>
        <CardHeader>
          <CardTitle>LLM Configuration</CardTitle>
          <CardDescription>
            Choose your preferred AI provider and model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={settings.provider}
                onValueChange={(value) =>
                  settings.setProvider(value as 'anthropic' | 'openai' | 'ollama')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  <SelectItem value="openai">OpenAI GPT</SelectItem>
                  <SelectItem value="ollama">Ollama (Local)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={settings.model}
                onValueChange={(value) => settings.setModel(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                      {model.recommended && ' (Recommended)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Temperature</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.temperature}
                </span>
              </div>
              <Slider
                value={[settings.temperature]}
                onValueChange={([value]) => settings.setTemperature(value)}
                min={0}
                max={2}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Lower = more focused, Higher = more creative
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Max Tokens</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.maxTokens}
                </span>
              </div>
              <Slider
                value={[settings.maxTokens]}
                onValueChange={([value]) => settings.setMaxTokens(value)}
                min={256}
                max={8192}
                step={256}
              />
              <p className="text-xs text-muted-foreground">
                Maximum length of generated responses
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Settings</CardTitle>
          <CardDescription>
            Configure text-to-speech behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ElevenLabsUsage />

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Voice</Label>
              <p className="text-sm text-muted-foreground">
                Generate audio for AI responses
              </p>
            </div>
            <Button
              variant={settings.voiceEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => settings.setVoiceEnabled(!settings.voiceEnabled)}
            >
              {settings.voiceEnabled ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Enabled
                </>
              ) : (
                'Disabled'
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-play Responses</Label>
              <p className="text-sm text-muted-foreground">
                Automatically play voice responses
              </p>
            </div>
            <Button
              variant={settings.autoPlayResponses ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                settings.setAutoPlayResponses(!settings.autoPlayResponses)
              }
            >
              {settings.autoPlayResponses ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Enabled
                </>
              ) : (
                'Disabled'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        Save Settings
      </Button>
    </div>
  );
}

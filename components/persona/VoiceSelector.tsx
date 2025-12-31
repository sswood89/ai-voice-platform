'use client';

/**
 * VoiceSelector Component
 * Voice selection with preview and settings adjustment
 */

import { useEffect, useState } from 'react';
import { Play, Square, Volume2, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVoiceStore } from '@/stores';
import type { PersonaVoiceConfig, Voice } from '@/types';

interface VoiceSelectorProps {
  voiceConfig: PersonaVoiceConfig;
  onChange: (config: PersonaVoiceConfig) => void;
}

export function VoiceSelector({ voiceConfig, onChange }: VoiceSelectorProps) {
  const {
    voices,
    clonedVoices,
    setVoices,
    currentlyPlaying,
    playPreview,
    stopPreview,
  } = useVoiceStore();

  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const allVoices = [...voices, ...clonedVoices];

  // Fetch voices on mount
  useEffect(() => {
    async function fetchVoices() {
      if (voices.length > 0) return; // Already loaded

      setIsLoadingVoices(true);
      try {
        const response = await fetch('/api/voices');
        if (response.ok) {
          const data = await response.json();
          setVoices(data.voices);
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
      } finally {
        setIsLoadingVoices(false);
      }
    }

    fetchVoices();
  }, [voices.length, setVoices]);

  const selectedVoice = allVoices.find((v) => v.id === voiceConfig.voiceId);

  const handleVoiceSelect = (voice: Voice) => {
    onChange({
      ...voiceConfig,
      voiceId: voice.id,
    });
  };

  const handlePlayPreview = (voice: Voice) => {
    if (currentlyPlaying === voice.id) {
      stopPreview();
    } else if (voice.previewUrl) {
      playPreview(voice.id, voice.previewUrl);
    }
  };

  const updateSetting = (key: keyof PersonaVoiceConfig, value: number) => {
    onChange({
      ...voiceConfig,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Voice Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select Voice</CardTitle>
              <CardDescription>
                Choose a voice for your persona. Click to select, use the play button to preview.
              </CardDescription>
            </div>
            <Link href="/voices">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Clone Voice
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingVoices ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading voices...</span>
            </div>
          ) : allVoices.length === 0 ? (
            <div className="text-center py-8">
              <Volume2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No voices available. Add your ElevenLabs API key in settings.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 max-h-64 overflow-y-auto">
              {allVoices.map((voice) => (
                <div
                  key={voice.id}
                  onClick={() => handleVoiceSelect(voice)}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border cursor-pointer
                    transition-colors hover:bg-muted/50
                    ${voiceConfig.voiceId === voice.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                    }
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{voice.name}</span>
                      {voice.isCloned && (
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                          Cloned
                        </span>
                      )}
                    </div>
                    {voice.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {voice.description}
                      </p>
                    )}
                  </div>
                  {voice.previewUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPreview(voice);
                      }}
                    >
                      {currentlyPlaying === voice.id ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Settings</CardTitle>
          <CardDescription>
            Adjust how the selected voice sounds
            {selectedVoice && (
              <span className="block mt-1 font-medium text-foreground">
                Current: {selectedVoice.name}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stability */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Stability</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(voiceConfig.stability * 100)}%
              </span>
            </div>
            <Slider
              value={[voiceConfig.stability]}
              onValueChange={([value]) => updateSetting('stability', value)}
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Higher stability makes the voice more consistent but less expressive
            </p>
          </div>

          {/* Similarity Boost */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Similarity Boost</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(voiceConfig.similarityBoost * 100)}%
              </span>
            </div>
            <Slider
              value={[voiceConfig.similarityBoost]}
              onValueChange={([value]) => updateSetting('similarityBoost', value)}
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Higher similarity makes the voice closer to the original but may reduce clarity
            </p>
          </div>

          {/* Style (optional) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Style Exaggeration</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round((voiceConfig.style ?? 0) * 100)}%
              </span>
            </div>
            <Slider
              value={[voiceConfig.style ?? 0]}
              onValueChange={([value]) => updateSetting('style', value)}
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Enhances the style of the original speaker (only for some voices)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

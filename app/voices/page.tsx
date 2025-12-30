'use client';

/**
 * Voices Page
 * Browse and manage voices, including voice cloning
 */

import { useEffect, useState } from 'react';
import { Mic, Play, Square, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVoiceStore, useSettingsStore } from '@/stores';
import { toast } from 'sonner';
import type { Voice } from '@/types';

export default function VoicesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const {
    voices,
    clonedVoices,
    setVoices,
    currentlyPlaying,
    playPreview,
    stopPreview,
  } = useVoiceStore();

  const allVoices = [...voices, ...clonedVoices];

  useEffect(() => {
    async function fetchVoices() {
      try {
        const response = await fetch('/api/voices');
        if (response.ok) {
          const data = await response.json();
          setVoices(data.voices);
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVoices();
  }, [setVoices]);

  const handlePlayPreview = (voice: Voice) => {
    if (currentlyPlaying === voice.id) {
      stopPreview();
    } else if (voice.previewUrl) {
      playPreview(voice.id, voice.previewUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Voices</h1>
          <p className="text-muted-foreground">
            Browse available voices and clone your own
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Clone Voice
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Voices</TabsTrigger>
          <TabsTrigger value="cloned">My Clones</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {allVoices.length === 0 ? (
            <div className="text-center py-12">
              <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No voices available. Add your ElevenLabs API key in settings to access voices.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allVoices.map((voice) => (
                <Card key={voice.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{voice.name}</CardTitle>
                        <CardDescription>
                          {voice.isCloned ? 'Cloned Voice' : 'Default Voice'}
                        </CardDescription>
                      </div>
                      {voice.previewUrl && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handlePlayPreview(voice)}
                        >
                          {currentlyPlaying === voice.id ? (
                            <Square className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  {voice.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {voice.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cloned" className="space-y-4">
          {clonedVoices.length === 0 ? (
            <div className="text-center py-12">
              <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No cloned voices yet. Upload audio samples to create your own voice.
              </p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Clone Your First Voice
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clonedVoices.map((voice) => (
                <Card key={voice.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{voice.name}</CardTitle>
                        <CardDescription>Cloned Voice</CardDescription>
                      </div>
                      {voice.previewUrl && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handlePlayPreview(voice)}
                        >
                          {currentlyPlaying === voice.id ? (
                            <Square className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

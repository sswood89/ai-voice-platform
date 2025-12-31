'use client';

/**
 * Voices Page
 * Browse and manage voices, including voice cloning
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mic, Play, Square, Upload, Loader2, AlertCircle, Settings, Wand2, Volume2, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVoiceStore } from '@/stores';
import { VoiceCloneDialog } from '@/components/voices/VoiceCloneDialog';
import { VoiceCloneGuide } from '@/components/voices/VoiceCloneGuide';
import { CreatePersonaPrompt } from '@/components/voices/CreatePersonaPrompt';
import type { Voice } from '@/types';

export default function VoicesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [personaPromptOpen, setPersonaPromptOpen] = useState(false);
  const [clonedVoiceInfo, setClonedVoiceInfo] = useState<{ id: string; name: string } | null>(null);
  const {
    voices,
    clonedVoices,
    setVoices,
    currentlyPlaying,
    playPreview,
    stopPreview,
  } = useVoiceStore();

  const allVoices = [...voices, ...clonedVoices];

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/voices');
      if (response.ok) {
        const data = await response.json();
        setVoices(data.voices);
        setIsConfigured(data.configured !== false);
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, [setVoices]);

  const handleCloneSuccess = (voiceId?: string, voiceName?: string) => {
    fetchVoices();
    // Show persona creation prompt after successful clone
    if (voiceId && voiceName) {
      setClonedVoiceInfo({ id: voiceId, name: voiceName });
      setPersonaPromptOpen(true);
    }
  };

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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowGuide(!showGuide)}>
            <Wand2 className="h-4 w-4 mr-2" />
            {showGuide ? 'Hide Guide' : 'Cloning Guide'}
          </Button>
          <Button onClick={() => setCloneDialogOpen(true)} disabled={!isConfigured}>
            <Upload className="h-4 w-4 mr-2" />
            Clone Voice
          </Button>
        </div>
      </div>

      {/* Unconfigured State Banner */}
      {!isConfigured && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                ElevenLabs API Not Configured
              </h2>
              <p className="text-amber-800 dark:text-amber-200 mb-4">
                Add your ElevenLabs API key to enable voice features:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Volume2 className="h-4 w-4" />
                  <span>Voice synthesis for chat responses</span>
                </li>
                <li className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Mic className="h-4 w-4" />
                  <span>Voice cloning from audio samples</span>
                </li>
                <li className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Library className="h-4 w-4" />
                  <span>Access to ElevenLabs voice library</span>
                </li>
              </ul>
              <div className="flex items-center gap-3">
                <Link href="/settings">
                  <Button variant="default" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure in Settings
                  </Button>
                </Link>
                <a
                  href="https://elevenlabs.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Get an API key →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Cloning Guide */}
      {showGuide && <VoiceCloneGuide />}

      <VoiceCloneDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        onSuccess={handleCloneSuccess}
      />

      {/* Post-clone persona creation prompt */}
      {clonedVoiceInfo && (
        <CreatePersonaPrompt
          open={personaPromptOpen}
          onOpenChange={setPersonaPromptOpen}
          voiceId={clonedVoiceInfo.id}
          voiceName={clonedVoiceInfo.name}
        />
      )}

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
              <Button onClick={() => setCloneDialogOpen(true)}>
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

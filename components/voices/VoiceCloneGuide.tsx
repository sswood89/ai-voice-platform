'use client';

/**
 * VoiceCloneGuide Component
 * Educational guide for voice cloning with requirements and tips
 */

import { useState } from 'react';
import {
  Mic,
  Clock,
  Volume2,
  FileAudio,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function VoiceCloneGuide() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['how-it-works', 'requirements']);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const sections: GuideSection[] = [
    {
      id: 'how-it-works',
      title: 'How Voice Cloning Works',
      icon: <Lightbulb className="h-5 w-5" />,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Voice cloning uses AI to learn the unique characteristics of a voice from audio samples.
            The more high-quality audio you provide, the better the cloned voice will sound.
          </p>
          <p>
            ElevenLabs analyzes your audio to capture speech patterns, tone, accent, and vocal
            qualities. The cloned voice can then speak any text while maintaining these characteristics.
          </p>
        </div>
      ),
    },
    {
      id: 'requirements',
      title: 'Audio Requirements',
      icon: <FileAudio className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Duration</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li><span className="font-medium">Minimum:</span> 1 minute of clear speech</li>
                <li><span className="font-medium">Recommended:</span> 3-5 minutes for best results</li>
                <li><span className="font-medium">Maximum:</span> 10MB per file (multiple files allowed)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <FileAudio className="h-4 w-4 text-green-500" />
                <span>Format</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li><span className="font-medium">Supported:</span> MP3, WAV, WebM, OGG</li>
                <li><span className="font-medium">Quality:</span> 44.1kHz or higher preferred</li>
                <li><span className="font-medium">Channels:</span> Mono or stereo</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'quality-checklist',
      title: 'Quality Checklist',
      icon: <CheckCircle2 className="h-5 w-5" />,
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Do This
            </h4>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Record in a quiet environment with minimal echo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Speak naturally at a consistent volume and pace</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Include varied sentences: questions, statements, exclamations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Use a good quality microphone 6-12 inches away</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Cover diverse sounds and phonemes in your speech</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-red-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Avoid This
            </h4>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>Background noise, music, or other speakers</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>Whispering or shouting</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>Heavy audio processing or effects</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>Long pauses or silence in recordings</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>Clipping or distorted audio</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'recording-tips',
      title: 'Recording Tips',
      icon: <Mic className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Pro Tip: Use Our Sample Scripts
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              We provide sample scripts designed specifically for voice cloning. They cover all
              common sounds in English and help create a more accurate voice clone. Click
              "Record Audio" in the clone dialog to access them.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <Volume2 className="h-5 w-5 mb-2 text-primary" />
              <h5 className="font-medium text-sm mb-1">Test Your Levels</h5>
              <p className="text-xs text-muted-foreground">
                Do a test recording and check that your voice is clear, not too quiet or distorted.
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <Mic className="h-5 w-5 mb-2 text-primary" />
              <h5 className="font-medium text-sm mb-1">Position Matters</h5>
              <p className="text-xs text-muted-foreground">
                Keep consistent distance from your mic. Moving around changes the sound quality.
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 mb-2 text-primary" />
              <h5 className="font-medium text-sm mb-1">Take Your Time</h5>
              <p className="text-xs text-muted-foreground">
                Read scripts slowly and clearly. Rushing can reduce clone quality.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'legal',
      title: 'Important Notice',
      icon: <AlertTriangle className="h-5 w-5" />,
      content: (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Voice Cloning Ethics:</strong> Only clone voices you have permission to use.
            Do not clone voices of others without their explicit consent. Voice cloning technology
            should be used responsibly and ethically. Misuse may violate laws and platform terms of service.
          </p>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Cloning Guide
        </CardTitle>
        <CardDescription>
          Learn how to create high-quality voice clones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          return (
            <div key={section.id} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="text-primary">{section.icon}</div>
                  <span className="font-medium">{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pt-0">{section.content}</div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

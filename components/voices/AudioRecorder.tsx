'use client';

/**
 * AudioRecorder Component
 * Browser-based audio recording with waveform visualization
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  maxDuration?: number; // seconds, 0 = unlimited
  showWaveform?: boolean;
  className?: string;
}

type RecordingState = 'idle' | 'requesting' | 'recording' | 'paused' | 'stopped';

export function AudioRecorder({
  onRecordingComplete,
  maxDuration = 300, // 5 minutes default
  showWaveform = true,
  className,
}: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(50).fill(0));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update audio visualization
  const updateVisualization = useCallback(() => {
    if (!analyserRef.current || state !== 'recording') return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Sample the frequency data to create visualization bars
    const barCount = 50;
    const step = Math.floor(dataArray.length / barCount);
    const newLevels = [];

    for (let i = 0; i < barCount; i++) {
      const start = i * step;
      let sum = 0;
      for (let j = start; j < start + step; j++) {
        sum += dataArray[j];
      }
      const avg = sum / step;
      newLevels.push(avg / 255); // Normalize to 0-1
    }

    setAudioLevels(newLevels);
    animationRef.current = requestAnimationFrame(updateVisualization);
  }, [state]);

  // Start recording
  const startRecording = async () => {
    setError(null);
    setState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setState('recording');
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (maxDuration > 0 && newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

      // Start visualization
      updateVisualization();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Could not access microphone. Please check permissions.');
      setState('idle');
    }
  };

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      setState('stopped');
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioLevels(new Array(50).fill(0));
  }, [state]);

  // Reset recording
  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setDuration(0);
    setState('idle');
    setError(null);
    setIsPlaying(false);
    chunksRef.current = [];
  };

  // Play/pause preview
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Confirm recording
  const confirmRecording = () => {
    if (chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      onRecordingComplete(blob, duration);
      resetRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle audio ended
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, [audioUrl]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Waveform visualization */}
      {showWaveform && (
        <div className="h-20 bg-muted/50 rounded-lg flex items-center justify-center px-2 gap-0.5 overflow-hidden">
          {audioLevels.map((level, i) => (
            <div
              key={i}
              className={cn(
                'w-1 rounded-full transition-all duration-75',
                state === 'recording' ? 'bg-red-500' : 'bg-muted-foreground/30'
              )}
              style={{
                height: `${Math.max(4, level * 64)}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Duration display */}
      <div className="text-center">
        <span
          className={cn(
            'font-mono text-3xl font-bold',
            state === 'recording' && 'text-red-500'
          )}
        >
          {formatDuration(duration)}
        </span>
        {maxDuration > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            / {formatDuration(maxDuration)}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {state === 'idle' && (
          <Button
            size="lg"
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Mic className="h-5 w-5 mr-2" />
            Start Recording
          </Button>
        )}

        {state === 'requesting' && (
          <Button size="lg" disabled>
            <Mic className="h-5 w-5 mr-2 animate-pulse" />
            Requesting Microphone...
          </Button>
        )}

        {state === 'recording' && (
          <Button
            size="lg"
            onClick={stopRecording}
            variant="destructive"
          >
            <Square className="h-5 w-5 mr-2" />
            Stop Recording
          </Button>
        )}

        {state === 'stopped' && audioUrl && (
          <>
            <Button size="icon" variant="outline" onClick={togglePlayback}>
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button size="icon" variant="outline" onClick={resetRecording}>
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button onClick={confirmRecording} className="bg-green-600 hover:bg-green-700 text-white">
              <Check className="h-5 w-5 mr-2" />
              Use Recording
            </Button>
          </>
        )}
      </div>

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} className="hidden" />
      )}

      {/* Recording tips */}
      {state === 'idle' && (
        <p className="text-xs text-center text-muted-foreground">
          Click to start recording. Speak clearly and maintain consistent volume.
        </p>
      )}

      {state === 'recording' && (
        <p className="text-xs text-center text-red-600 animate-pulse">
          Recording in progress... Click stop when finished.
        </p>
      )}

      {state === 'stopped' && (
        <p className="text-xs text-center text-muted-foreground">
          Review your recording, then click "Use Recording" to add it.
        </p>
      )}
    </div>
  );
}

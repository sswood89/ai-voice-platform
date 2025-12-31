'use client';

/**
 * Voice Clone Dialog
 * Dialog for cloning voices with audio file upload and recording
 */

import { useState, useRef } from 'react';
import { Upload, X, FileAudio, Loader2, Info, Mic, FileText, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AudioRecorder } from './AudioRecorder';
import { CLONE_SCRIPTS, type CloneScript } from '@/lib/voice/clone-scripts';
import { cn } from '@/lib/utils';

interface VoiceCloneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (voiceId?: string, voiceName?: string) => void;
}

interface RecordedAudio {
  blob: Blob;
  duration: number;
  name: string;
}

const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const CLONE_GUIDELINES = [
  'Record at least 1 minute of clear speech (3+ minutes recommended)',
  'Use a quiet environment with minimal background noise',
  'Speak naturally at a consistent volume and pace',
  'Avoid music, sound effects, or multiple speakers',
  'Use MP3 or WAV format for best results',
];

export function VoiceCloneDialog({ open, onOpenChange, onSuccess }: VoiceCloneDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [recordings, setRecordings] = useState<RecordedAudio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
  const [selectedScript, setSelectedScript] = useState<CloneScript | null>(null);
  const [showScriptSelector, setShowScriptSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: MP3, WAV, WebM, OGG`,
      };
    }
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 10MB`,
      };
    }
    return { valid: true };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        toast.error(`${file.name}: ${validation.error}`);
      }
    }

    setFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    const recordingName = `Recording ${recordings.length + 1}`;
    setRecordings(prev => [...prev, { blob, duration, name: recordingName }]);
    toast.success('Recording added!');
  };

  const removeRecording = (index: number) => {
    setRecordings(prev => prev.filter((_, i) => i !== index));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a voice name');
      return;
    }

    const totalItems = files.length + recordings.length;
    if (totalItems === 0) {
      toast.error('Please upload or record at least one audio sample');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      // Add uploaded files
      for (const file of files) {
        formData.append('files', file);
      }

      // Add recordings as files
      for (let i = 0; i < recordings.length; i++) {
        const recording = recordings[i];
        const file = new File([recording.blob], `recording-${i + 1}.webm`, {
          type: 'audio/webm',
        });
        formData.append('files', file);
      }

      const response = await fetch('/api/voices/clone', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clone voice');
      }

      const data = await response.json();
      toast.success(`Voice "${name}" cloned successfully!`);
      onSuccess(data.voiceId, name);
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to clone voice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setFiles([]);
    setRecordings([]);
    setShowGuidelines(false);
    setActiveTab('upload');
    setSelectedScript(null);
    setShowScriptSelector(false);
    onOpenChange(false);
  };

  const totalAudioItems = files.length + recordings.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Clone a Voice</DialogTitle>
          <DialogDescription>
            Upload audio samples or record directly to create a custom voice clone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Voice Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Voice, Brand Voice"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this voice (optional)"
              rows={2}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Audio Samples * ({totalAudioItems} added)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowGuidelines(!showGuidelines)}
              >
                <Info className="h-4 w-4 mr-1" />
                Guidelines
              </Button>
            </div>

            {showGuidelines && (
              <div className="bg-muted rounded-md p-3 text-sm space-y-1">
                <p className="font-medium mb-2">Recording Tips:</p>
                {CLONE_GUIDELINES.map((tip, i) => (
                  <p key={i} className="text-muted-foreground">
                    {i + 1}. {tip}
                  </p>
                ))}
              </div>
            )}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'record')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Files
                </TabsTrigger>
                <TabsTrigger value="record" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Record Audio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4 mt-4">
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload audio files
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP3, WAV, WebM, OGG (max 10MB each)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </TabsContent>

              <TabsContent value="record" className="space-y-4 mt-4">
                {/* Script Selector */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setShowScriptSelector(!showScriptSelector)}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {selectedScript ? selectedScript.name : 'Choose a script (recommended)'}
                    </span>
                    <ChevronRight className={cn(
                      'h-4 w-4 transition-transform',
                      showScriptSelector && 'rotate-90'
                    )} />
                  </Button>

                  {showScriptSelector && (
                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        className={cn(
                          'w-full text-left p-3 hover:bg-muted/50 transition-colors',
                          !selectedScript && 'bg-muted/50'
                        )}
                        onClick={() => {
                          setSelectedScript(null);
                          setShowScriptSelector(false);
                        }}
                      >
                        <span className="font-medium text-sm">Free Recording</span>
                        <p className="text-xs text-muted-foreground">
                          Say whatever you want without a script
                        </p>
                      </button>
                      {CLONE_SCRIPTS.map((script) => (
                        <button
                          key={script.id}
                          type="button"
                          className={cn(
                            'w-full text-left p-3 hover:bg-muted/50 transition-colors',
                            selectedScript?.id === script.id && 'bg-muted/50'
                          )}
                          onClick={() => {
                            setSelectedScript(script);
                            setShowScriptSelector(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{script.name}</span>
                            <span className="text-xs text-muted-foreground">{script.duration}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {script.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Script Display */}
                {selectedScript && (
                  <div className="bg-muted/50 rounded-lg p-4 max-h-32 overflow-y-auto">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      Read this script:
                    </p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedScript.text}
                    </p>
                  </div>
                )}

                {/* Audio Recorder */}
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  maxDuration={300}
                  showWaveform
                />
              </TabsContent>
            </Tabs>

            {/* Combined file/recording list */}
            {(files.length > 0 || recordings.length > 0) && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium">Added Audio ({totalAudioItems})</p>
                {files.map((file, index) => (
                  <div
                    key={`file-${index}`}
                    className="flex items-center justify-between bg-muted rounded-md p-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileAudio className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {recordings.map((recording, index) => (
                  <div
                    key={`recording-${index}`}
                    className="flex items-center justify-between bg-muted rounded-md p-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Mic className="h-4 w-4 flex-shrink-0 text-red-500" />
                      <span className="text-sm truncate">{recording.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({formatDuration(recording.duration)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => removeRecording(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim() || totalAudioItems === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cloning...
                </>
              ) : (
                'Clone Voice'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

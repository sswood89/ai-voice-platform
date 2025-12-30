/**
 * Voice Cloning
 * ElevenLabs Voice Cloning API integration
 */

import type {
  Voice,
  VoiceCloneRequest,
  VoiceCloneResponse,
  ElevenLabsVoice,
  ElevenLabsVoicesResponse,
} from '@/types';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export interface VoiceCloningConfig {
  apiKey: string;
}

/**
 * Transform ElevenLabs voice to our Voice type
 */
function transformVoice(elevenLabsVoice: ElevenLabsVoice, isCloned = false): Voice {
  return {
    id: elevenLabsVoice.voice_id,
    name: elevenLabsVoice.name,
    description: elevenLabsVoice.description,
    previewUrl: elevenLabsVoice.preview_url,
    labels: elevenLabsVoice.labels,
    isCloned,
    isDefault: elevenLabsVoice.category === 'premade',
  };
}

/**
 * List all available voices
 */
export async function listVoices(apiKey: string): Promise<Voice[]> {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list voices: ${response.status} - ${errorText}`);
  }

  const data: ElevenLabsVoicesResponse = await response.json();

  return data.voices.map(voice =>
    transformVoice(voice, voice.category === 'cloned')
  );
}

/**
 * Get a specific voice by ID
 */
export async function getVoice(apiKey: string, voiceId: string): Promise<Voice> {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices/${voiceId}`, {
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get voice: ${response.status} - ${errorText}`);
  }

  const voice: ElevenLabsVoice = await response.json();
  return transformVoice(voice, voice.category === 'cloned');
}

/**
 * Clone a voice from audio samples
 */
export async function cloneVoice(
  apiKey: string,
  request: VoiceCloneRequest
): Promise<VoiceCloneResponse> {
  const formData = new FormData();

  formData.append('name', request.name);

  if (request.description) {
    formData.append('description', request.description);
  }

  // Add audio files
  for (const file of request.files) {
    formData.append('files', file);
  }

  // Add labels if provided
  if (request.labels) {
    formData.append('labels', JSON.stringify(request.labels));
  }

  const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to clone voice: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    voiceId: data.voice_id,
    name: request.name,
  };
}

/**
 * Delete a cloned voice
 */
export async function deleteVoice(apiKey: string, voiceId: string): Promise<void> {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices/${voiceId}`, {
    method: 'DELETE',
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete voice: ${response.status} - ${errorText}`);
  }
}

/**
 * Edit a voice's settings
 */
export async function editVoice(
  apiKey: string,
  voiceId: string,
  updates: { name?: string; description?: string; labels?: Record<string, string> }
): Promise<void> {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices/${voiceId}/edit`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to edit voice: ${response.status} - ${errorText}`);
  }
}

/**
 * Get user subscription info (for voice limits)
 */
export async function getSubscriptionInfo(apiKey: string): Promise<{
  characterCount: number;
  characterLimit: number;
  voiceLimit: number;
  canClone: boolean;
}> {
  const response = await fetch(`${ELEVENLABS_API_URL}/user/subscription`, {
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get subscription info: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    characterCount: data.character_count,
    characterLimit: data.character_limit,
    voiceLimit: data.voice_limit ?? 10,
    canClone: data.can_use_instant_voice_cloning ?? false,
  };
}

/**
 * Validate audio file for voice cloning
 */
export function validateCloneAudio(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: MP3, WAV, WebM, OGG`,
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 10MB`,
    };
  }

  return { valid: true };
}

/**
 * Get recommended recording guidelines for voice cloning
 */
export function getCloneGuidelines(): string[] {
  return [
    'Record at least 1 minute of clear speech (3+ minutes recommended)',
    'Use a quiet environment with minimal background noise',
    'Speak naturally at a consistent volume and pace',
    'Avoid music, sound effects, or multiple speakers',
    'Use a good quality microphone (built-in laptop mic is usually fine)',
    'Record in MP3 or WAV format at 44.1kHz or higher',
    'Include varied sentence types (questions, statements, exclamations)',
    'Speak in the style you want the cloned voice to replicate',
  ];
}

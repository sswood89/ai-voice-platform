/**
 * Voice Module
 * TTS and Voice Cloning exports
 */

export {
  TTSEngine,
  getTTSEngine,
  initializeTTS,
  createTTSEngine,
  DEFAULT_VOICES,
  type TTSEngineConfig,
} from './tts-engine';

export {
  listVoices,
  getVoice,
  cloneVoice,
  deleteVoice,
  editVoice,
  getSubscriptionInfo,
  validateCloneAudio,
  getCloneGuidelines,
} from './voice-cloning';

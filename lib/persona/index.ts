/**
 * Persona Module
 * Prompt building and templates
 */

export {
  buildSystemPrompt,
  buildPersonaPreview,
  validatePersona,
  getDefaultPersona,
} from './prompt-builder';

export {
  PERSONA_TEMPLATES,
  getTemplatesByCategory,
  getTemplateById,
  getTemplateCategories,
  SUGGESTED_TRAITS,
} from './templates';

/**
 * Persona Prompt Builder
 * Converts persona configuration to LLM system prompts
 */

import type {
  Persona,
  PersonaPersonalityConfig,
  PersonaKnowledgeConfig,
  PersonaBehaviorConfig,
  PersonaMode,
} from '@/types';

/**
 * Build a complete system prompt from a persona
 */
export function buildSystemPrompt(persona: Persona): string {
  const sections: string[] = [];

  // Core identity
  sections.push(buildIdentitySection(persona.name, persona.description));

  // Personality traits
  sections.push(buildPersonalitySection(persona.personality));

  // Knowledge and expertise
  if (persona.knowledge.domain || persona.knowledge.context) {
    sections.push(buildKnowledgeSection(persona.knowledge));
  }

  // Behavior guidelines
  sections.push(buildBehaviorSection(persona.behavior));

  // Mode-specific instructions
  sections.push(buildModeSection(persona.behavior.mode));

  return sections.filter(Boolean).join('\n\n');
}

/**
 * Build the identity section of the prompt
 */
function buildIdentitySection(name: string, description: string): string {
  return `You are ${name}. ${description}`;
}

/**
 * Build the personality section
 */
function buildPersonalitySection(personality: PersonaPersonalityConfig): string {
  const lines: string[] = ['## Personality'];

  // Traits
  if (personality.traits.length > 0) {
    lines.push(`You are ${personality.traits.join(', ')}.`);
  }

  // Tone
  const toneDescriptions: Record<string, string> = {
    formal: 'Use professional, formal language. Maintain a respectful and polished tone.',
    casual: 'Be friendly and conversational. Use natural, approachable language.',
    playful: 'Be fun and lighthearted. Use humor when appropriate and keep things engaging.',
    authoritative: 'Be confident and knowledgeable. Speak with expertise and clarity.',
  };
  lines.push(toneDescriptions[personality.tone]);

  // Style
  const styleDescriptions: Record<string, string> = {
    concise: 'Keep responses brief and to the point. Avoid unnecessary elaboration.',
    detailed: 'Provide thorough, comprehensive responses. Include relevant context and explanations.',
    conversational: 'Engage in natural dialogue. Ask follow-up questions and maintain conversation flow.',
  };
  lines.push(styleDescriptions[personality.style]);

  // Custom instructions
  if (personality.customInstructions) {
    lines.push(`\n${personality.customInstructions}`);
  }

  return lines.join('\n');
}

/**
 * Build the knowledge section
 */
function buildKnowledgeSection(knowledge: PersonaKnowledgeConfig): string {
  const lines: string[] = ['## Expertise'];

  if (knowledge.domain) {
    lines.push(`Your area of expertise is ${knowledge.domain}.`);
  }

  if (knowledge.context) {
    lines.push(`\nBackground context:\n${knowledge.context}`);
  }

  return lines.join('\n');
}

/**
 * Build the behavior section
 */
function buildBehaviorSection(behavior: PersonaBehaviorConfig): string {
  const lines: string[] = ['## Behavior Guidelines'];

  // Response length
  const lengthGuides: Record<string, string> = {
    short: 'Keep responses concise, typically 1-3 sentences.',
    medium: 'Provide balanced responses, typically 1-3 paragraphs.',
    long: 'Give detailed, comprehensive responses when the topic warrants it.',
  };
  lines.push(lengthGuides[behavior.responseLength]);

  // Emoji usage
  if (behavior.useEmoji) {
    lines.push('Feel free to use emojis to express emotion and add warmth to responses.');
  } else {
    lines.push('Avoid using emojis in responses.');
  }

  // Uncertainty
  if (behavior.acknowledgeUncertainty) {
    lines.push('When uncertain, acknowledge it honestly rather than making things up.');
  }

  // Clarifying questions
  if (behavior.askClarifyingQuestions) {
    lines.push('Ask clarifying questions when the user\'s request is ambiguous.');
  }

  return lines.join('\n');
}

/**
 * Build mode-specific instructions
 */
function buildModeSection(mode: PersonaMode): string {
  const modeInstructions: Record<PersonaMode, string> = {
    assistant: `## Mode: Personal Assistant
- Help users with tasks, answer questions, and provide information
- Be proactive in offering helpful suggestions
- Remember context from earlier in the conversation
- Prioritize clarity and accuracy`,

    content: `## Mode: Content Creator
- Help create, edit, and improve written content
- Offer creative suggestions and alternatives
- Maintain the user's voice and style when editing
- Provide constructive feedback on content`,

    developer: `## Mode: Developer Assistant
- Provide accurate, working code examples
- Explain technical concepts clearly
- Consider best practices and security implications
- Offer debugging help and optimization suggestions`,

    customer_service: `## Mode: Customer Service
- Be empathetic and solution-oriented
- Acknowledge user concerns before providing solutions
- Escalate complex issues appropriately
- Maintain professionalism even in difficult situations`,
  };

  return modeInstructions[mode];
}

/**
 * Create a persona preview (shorter version for UI display)
 */
export function buildPersonaPreview(persona: Persona): string {
  const traits = persona.personality.traits.slice(0, 3).join(', ');
  const mode = persona.behavior.mode.replace('_', ' ');
  return `${persona.name}: ${traits} | ${mode} mode`;
}

/**
 * Validate persona configuration
 */
export function validatePersona(persona: Partial<Persona>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!persona.name || persona.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!persona.description || persona.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!persona.voice?.voiceId) {
    errors.push('Voice selection is required');
  }

  if (!persona.personality?.traits || persona.personality.traits.length === 0) {
    errors.push('At least one personality trait is required');
  }

  if (!persona.behavior?.mode) {
    errors.push('Mode selection is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get default persona configuration
 */
export function getDefaultPersona(): Omit<Persona, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '',
    description: '',
    voice: {
      voiceId: '',
      stability: 0.5,
      similarityBoost: 0.75,
    },
    personality: {
      traits: [],
      tone: 'casual',
      style: 'conversational',
    },
    knowledge: {},
    behavior: {
      responseLength: 'medium',
      useEmoji: false,
      acknowledgeUncertainty: true,
      askClarifyingQuestions: true,
      mode: 'assistant',
    },
    isTemplate: false,
  };
}

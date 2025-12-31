import { createClient } from '../client';
import type { Persona as DbPersona } from '../types';
import type { Persona, CreatePersonaInput, UpdatePersonaInput, PersonaTone, PersonaStyle, PersonaMode, ResponseLength } from '@/types';

/**
 * Convert database persona to app persona format
 * The DB stores a flattened version, we reconstruct the nested structure
 */
function toAppPersona(db: DbPersona): Persona {
  return {
    id: db.id,
    name: db.name,
    description: db.description ?? '',
    avatar: db.avatar ?? undefined,
    voice: {
      voiceId: db.voice_id ?? '',
      stability: 0.5,
      similarityBoost: 0.5,
    },
    personality: {
      traits: [],
      tone: 'casual' as PersonaTone,
      style: 'conversational' as PersonaStyle,
      customInstructions: db.system_prompt ?? undefined,
    },
    knowledge: {},
    behavior: {
      responseLength: 'medium' as ResponseLength,
      useEmoji: false,
      acknowledgeUncertainty: true,
      askClarifyingQuestions: true,
      mode: 'assistant' as PersonaMode,
    },
    isTemplate: db.is_template,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

/**
 * Convert app persona to database format
 */
function toDbPersona(
  app: CreatePersonaInput,
  userId: string
): Record<string, unknown> {
  return {
    user_id: userId,
    name: app.name,
    description: app.description ?? null,
    avatar: app.avatar ?? null,
    system_prompt: app.personality?.customInstructions ?? null,
    voice_id: app.voice?.voiceId ?? null,
    temperature: 0.7,
    creativity: 50,
    formality: app.personality?.tone === 'formal' ? 80 : 50,
    humor: app.personality?.tone === 'playful' ? 80 : 50,
    empathy: 50,
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    is_template: app.isTemplate ?? false,
    is_public: false,
  };
}

export async function fetchPersonas(): Promise<Persona[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toAppPersona);
}

export async function fetchPersonaById(id: string): Promise<Persona | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return toAppPersona(data);
}

export async function createPersona(
  input: CreatePersonaInput,
  userId: string
): Promise<Persona> {
  const supabase = createClient();
  const dbPersona = toDbPersona(input, userId);

  const { data, error } = await supabase
    .from('personas')
    .insert(dbPersona)
    .select()
    .single();

  if (error) throw error;
  return toAppPersona(data);
}

export async function updatePersona(
  id: string,
  input: UpdatePersonaInput
): Promise<Persona> {
  const supabase = createClient();

  // Build update object
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.avatar !== undefined) updates.avatar = input.avatar;
  if (input.voice?.voiceId !== undefined) updates.voice_id = input.voice.voiceId;
  if (input.personality?.customInstructions !== undefined)
    updates.system_prompt = input.personality.customInstructions;
  if (input.personality?.tone !== undefined) {
    updates.formality = input.personality.tone === 'formal' ? 80 : 50;
    updates.humor = input.personality.tone === 'playful' ? 80 : 50;
  }

  const { data, error } = await supabase
    .from('personas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toAppPersona(data);
}

export async function deletePersona(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('personas').delete().eq('id', id);

  if (error) throw error;
}

export async function duplicatePersona(
  id: string,
  userId: string
): Promise<Persona> {
  const supabase = createClient();

  // Get original
  const { data: original, error: fetchError } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // Create copy without id, created_at, updated_at
  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = original;
  const { data: copy, error: createError } = await supabase
    .from('personas')
    .insert({
      ...rest,
      name: `${original.name} (Copy)`,
      user_id: userId,
      is_template: false,
    })
    .select()
    .single();

  if (createError) throw createError;
  return toAppPersona(copy);
}

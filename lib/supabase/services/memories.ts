import { createClient } from '../client';
import type { Memory as DbMemory } from '../types';
import type { Memory, CreateMemoryInput, MemoryMessageRange } from '@/types';

/**
 * Convert database memory to app memory format
 */
function toAppMemory(db: DbMemory): Memory {
  const defaultRange: MemoryMessageRange = {
    startId: '',
    endId: '',
    count: 0,
  };

  return {
    id: db.id,
    personaId: db.persona_id ?? '',
    conversationId: '', // Not stored in current DB schema
    summary: db.content,
    topics: db.keywords,
    messageRange: defaultRange,
    createdAt: new Date(db.created_at),
    expiresAt: undefined,
  };
}

export async function fetchMemories(personaId?: string): Promise<Memory[]> {
  const supabase = createClient();

  let query = supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: false });

  if (personaId) {
    query = query.eq('persona_id', personaId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map(toAppMemory);
}

export async function createMemory(
  input: CreateMemoryInput,
  userId: string
): Promise<Memory> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('memories')
    .insert({
      user_id: userId,
      persona_id: input.personaId,
      content: input.summary,
      keywords: input.topics,
      importance: 5, // Default importance
      source: 'conversation',
    })
    .select()
    .single();

  if (error) throw error;
  return toAppMemory(data);
}

export async function deleteMemory(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('memories').delete().eq('id', id);

  if (error) throw error;
}

export async function clearPersonaMemories(personaId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('persona_id', personaId);

  if (error) throw error;
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/personas
 * List all personas for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, name, avatar, description')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ personas });
  } catch (error) {
    console.error('List personas error:', error);
    return NextResponse.json(
      { error: 'Failed to list personas' },
      { status: 500 }
    );
  }
}

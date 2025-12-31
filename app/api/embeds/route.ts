import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/embeds
 * List all embeds for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: embeds, error } = await supabase
      .from('embeds')
      .select(`
        *,
        persona:personas(id, name, avatar)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ embeds });
  } catch (error) {
    console.error('List embeds error:', error);
    return NextResponse.json(
      { error: 'Failed to list embeds' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/embeds
 * Create a new embed
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check tier limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.tier || 'free';

    // Count existing embeds
    const { count } = await supabase
      .from('embeds')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const embedLimits = { free: 0, pro: 1, business: -1 };
    const limit = embedLimits[tier as keyof typeof embedLimits];

    if (limit !== -1 && (count || 0) >= limit) {
      return NextResponse.json(
        { error: `Embed limit reached for ${tier} tier` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      personaId,
      allowedOrigins = [],
      theme = 'auto',
      primaryColor = '#6366f1',
      position = 'bottom-right',
      welcomeMessage,
      rateLimit = 100,
    } = body;

    if (!name || !personaId) {
      return NextResponse.json(
        { error: 'Name and personaId are required' },
        { status: 400 }
      );
    }

    // Verify persona belongs to user
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('id', personaId)
      .eq('user_id', user.id)
      .single();

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    const { data: embed, error } = await supabase
      .from('embeds')
      .insert({
        user_id: user.id,
        persona_id: personaId,
        name,
        allowed_origins: allowedOrigins,
        theme,
        primary_color: primaryColor,
        position,
        welcome_message: welcomeMessage,
        rate_limit: rateLimit,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ embed }, { status: 201 });
  } catch (error) {
    console.error('Create embed error:', error);
    return NextResponse.json(
      { error: 'Failed to create embed' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ embedId: string }>;
}

/**
 * GET /api/embeds/[embedId]
 * Get a specific embed
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { embedId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: embed, error } = await supabase
      .from('embeds')
      .select(`
        *,
        persona:personas(id, name, avatar, description)
      `)
      .eq('id', embedId)
      .eq('user_id', user.id)
      .single();

    if (error || !embed) {
      return NextResponse.json({ error: 'Embed not found' }, { status: 404 });
    }

    return NextResponse.json({ embed });
  } catch (error) {
    console.error('Get embed error:', error);
    return NextResponse.json(
      { error: 'Failed to get embed' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/embeds/[embedId]
 * Update an embed
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { embedId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    // Only include provided fields
    if (body.name !== undefined) updates.name = body.name;
    if (body.personaId !== undefined) updates.persona_id = body.personaId;
    if (body.allowedOrigins !== undefined) updates.allowed_origins = body.allowedOrigins;
    if (body.theme !== undefined) updates.theme = body.theme;
    if (body.primaryColor !== undefined) updates.primary_color = body.primaryColor;
    if (body.position !== undefined) updates.position = body.position;
    if (body.welcomeMessage !== undefined) updates.welcome_message = body.welcomeMessage;
    if (body.rateLimit !== undefined) updates.rate_limit = body.rateLimit;
    if (body.isActive !== undefined) updates.is_active = body.isActive;

    const { data: embed, error } = await supabase
      .from('embeds')
      .update(updates)
      .eq('id', embedId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !embed) {
      return NextResponse.json({ error: 'Embed not found' }, { status: 404 });
    }

    return NextResponse.json({ embed });
  } catch (error) {
    console.error('Update embed error:', error);
    return NextResponse.json(
      { error: 'Failed to update embed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/embeds/[embedId]
 * Delete an embed
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { embedId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('embeds')
      .delete()
      .eq('id', embedId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete embed error:', error);
    return NextResponse.json(
      { error: 'Failed to delete embed' },
      { status: 500 }
    );
  }
}

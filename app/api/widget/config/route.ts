import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin, generateSessionId } from '@/lib/widget/security';

/**
 * GET /api/widget/config
 * Get embed configuration and generate session
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const embedId = searchParams.get('embedId');
  const origin = searchParams.get('origin');

  if (!embedId) {
    return NextResponse.json(
      { error: 'Missing embedId parameter' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    // Get embed configuration
    const { data: embed, error: embedError } = await supabase
      .from('embeds')
      .select(`
        *,
        persona:personas(
          id,
          name,
          description,
          avatar,
          system_prompt
        )
      `)
      .eq('id', embedId)
      .eq('is_active', true)
      .single();

    if (embedError || !embed) {
      return NextResponse.json(
        { error: 'Widget not found or inactive' },
        { status: 404 }
      );
    }

    // Validate origin if specified
    if (origin && embed.allowed_origins.length > 0) {
      if (!validateOrigin(origin, embed.allowed_origins)) {
        return NextResponse.json(
          { error: 'Origin not allowed' },
          { status: 403 }
        );
      }
    }

    // Generate session ID
    const sessionId = generateSessionId();

    // Return config
    return NextResponse.json({
      config: {
        name: embed.name,
        personaName: embed.persona?.name || 'Assistant',
        personaAvatar: embed.persona?.avatar,
        welcomeMessage: embed.welcome_message,
        primaryColor: embed.primary_color,
        theme: embed.theme,
      },
      sessionId,
    });
  } catch (error) {
    console.error('Widget config error:', error);
    return NextResponse.json(
      { error: 'Failed to load widget configuration' },
      { status: 500 }
    );
  }
}

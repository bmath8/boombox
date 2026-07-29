import { type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    logger.info('Auth callback received', { code: code?.substring(0, 10) + '...', next });

    if (!isSupabaseConfigured()) {
        logger.error('Supabase not configured for auth callback');
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=not_configured`);
    }

    if (code) {
        const supabase = await createServerSupabaseClient();

        if (!supabase) {
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=service_unavailable`);
        }

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            logger.error('Session exchange error', error);
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error.message}`);
        }

        if (data?.session) {
            logger.info('Session created successfully', { email: data.user?.email });
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    logger.warn('No code provided in callback');
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`);
}

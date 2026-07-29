/**
 * Spotify OAuth Callback Route
 * Handles the OAuth callback from Spotify and exchanges code for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { env, isSupabaseConfigured, isSpotifyConfigured } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const state = requestUrl.searchParams.get('state');
    const error = requestUrl.searchParams.get('error');

    // Check if properly configured
    if (!isSpotifyConfigured() || !isSupabaseConfigured()) {
        console.error('Spotify OAuth callback: Missing configuration');
        return NextResponse.redirect(
            `${requestUrl.origin}/auth/error?error=not_configured`
        );
    }

    // Handle OAuth errors
    if (error) {
        return NextResponse.redirect(
            `${requestUrl.origin}/auth/error?error=${error}`
        );
    }

    if (!code) {
        return NextResponse.redirect(
            `${requestUrl.origin}/auth/error?error=no_code`
        );
    }

    // CRITICAL: Validate CSRF state parameter
    try {
        const { validateOAuthState } = await import('@/lib/oauth-state');
        await validateOAuthState(state);
    } catch (stateError) {
        console.error('OAuth state validation failed:', stateError);
        return NextResponse.redirect(
            `${requestUrl.origin}/auth/error?error=csrf_detected`
        );
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${btoa(
                    `${env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ''}:${env.SPOTIFY_CLIENT_SECRET || ''}`
                )}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || '',
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for tokens');
        }

        const tokens = await tokenResponse.json();

        // Store tokens in Supabase session
        const supabase = await createServerSupabaseClient();

        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // Update session with Spotify tokens
                await supabase.auth.updateUser({
                    data: {
                        spotify_access_token: tokens.access_token,
                        spotify_refresh_token: tokens.refresh_token,
                        spotify_expires_at: Date.now() + tokens.expires_in * 1000,
                    },
                });
            }
        }

        // Redirect to app
        return NextResponse.redirect(`${requestUrl.origin}/radio`);
    } catch (error) {
        console.error('Spotify OAuth error:', error);
        return NextResponse.redirect(
            `${requestUrl.origin}/auth/error?error=token_exchange_failed`
        );
    }
}

/**
 * Spotify OAuth Initialization
 * Stores CSRF state parameter in httpOnly cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { storeOAuthState } from '@/lib/oauth-state';

export async function POST(request: NextRequest) {
    try {
        const { state } = await request.json();

        if (!state || typeof state !== 'string') {
            return NextResponse.json(
                { error: 'Invalid state parameter' },
                { status: 400 }
            );
        }

        // Store state in httpOnly cookie
        await storeOAuthState(state);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('OAuth init error:', error);
        return NextResponse.json(
            { error: 'Failed to initialize OAuth' },
            { status: 500 }
        );
    }
}

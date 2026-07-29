/**
 * OAuth State Management - Server Side Only
 * Prevents CSRF attacks by validating state parameter
 * NOTE: This file uses next/headers and can ONLY be used in Server Components/API routes
 */

import 'server-only';
import { cookies } from 'next/headers';

const STATE_COOKIE_NAME = 'oauth_state';
const STATE_COOKIE_MAX_AGE = 600; // 10 minutes

/**
 * Generate a cryptographically secure random state parameter
 */
export function generateOAuthState(): string {
    // Use crypto.randomUUID() for secure random state
    return crypto.randomUUID();
}

/**
 * Store OAuth state in httpOnly cookie
 */
export async function storeOAuthState(state: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE_NAME, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: STATE_COOKIE_MAX_AGE,
        path: '/',
    });
}

/**
 * Validate OAuth state parameter against stored state
 * @throws Error if state is invalid or missing
 */
export async function validateOAuthState(receivedState: string | null): Promise<void> {
    if (!receivedState) {
        throw new Error('Missing state parameter');
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get(STATE_COOKIE_NAME)?.value;

    // Clear the state cookie after validation attempt
    cookieStore.delete(STATE_COOKIE_NAME);

    if (!storedState) {
        throw new Error('Missing stored state - possible CSRF attack or expired session');
    }

    if (receivedState !== storedState) {
        throw new Error('State mismatch - possible CSRF attack');
    }
}

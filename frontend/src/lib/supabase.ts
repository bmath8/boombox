import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from './env';

/**
 * Supabase Client Singleton
 * Returns a real client when configured, or a stub that gracefully fails
 */

let supabaseInstance: SupabaseClient | null = null;

// Create a stub client that returns empty/error responses
function createStubClient(): SupabaseClient {
    const stubResponse = {
        data: null,
        error: { message: 'Supabase not configured', code: 'NOT_CONFIGURED' }
    };

    const stubPromise = <T>(data: T) => Promise.resolve(data as T);

    // Create a Proxy that handles all method calls
    const createProxy = (): any => new Proxy({}, {
        get: () => createProxy(),
        apply: () => stubPromise(stubResponse),
    });

    // Return a minimal stub that won't crash but won't work either
    return {
        auth: {
            getSession: () => stubPromise({ data: { session: null }, error: null }),
            getUser: () => stubPromise({ data: { user: null }, error: null }),
            signInWithPassword: () => stubPromise({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
            signInWithOAuth: () => stubPromise({ data: { url: null, provider: null }, error: { message: 'Supabase not configured' } }),
            signUp: () => stubPromise({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
            signOut: () => stubPromise({ error: null }),
            updateUser: () => stubPromise({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            exchangeCodeForSession: () => stubPromise({ data: { session: null, user: null }, error: { message: 'Supabase not configured' } }),
        },
        from: () => ({
            select: () => ({
                limit: () => ({
                    single: () => stubPromise(stubResponse),
                    then: (cb: any) => stubPromise(stubResponse).then(cb),
                }),
                eq: () => ({
                    limit: () => stubPromise(stubResponse),
                    single: () => stubPromise(stubResponse),
                }),
                ilike: () => ({
                    limit: () => stubPromise(stubResponse),
                    eq: () => ({
                        limit: () => stubPromise(stubResponse),
                    }),
                }),
                then: (cb: any) => stubPromise(stubResponse).then(cb),
            }),
            insert: () => stubPromise(stubResponse),
            update: () => ({ eq: () => stubPromise(stubResponse) }),
            delete: () => ({ eq: () => stubPromise(stubResponse) }),
            upsert: () => stubPromise(stubResponse),
        }),
        storage: {
            from: () => ({
                upload: () => stubPromise(stubResponse),
                download: () => stubPromise(stubResponse),
                getPublicUrl: () => ({ data: { publicUrl: '' } }),
            }),
        },
        rpc: () => stubPromise(stubResponse),
        channel: () => ({
            on: () => ({ subscribe: () => ({}) }),
            subscribe: () => ({}),
            unsubscribe: () => { },
        }),
    } as unknown as SupabaseClient;
}

function createClient(): SupabaseClient {
    if (!isSupabaseConfigured()) {
        if (typeof window !== 'undefined') {
            console.warn('⚠️ Supabase not configured. Using stub client - auth features will not work.');
        }
        return createStubClient();
    }

    try {
        return createBrowserClient(
            env.NEXT_PUBLIC_SUPABASE_URL!,
            env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    } catch (error) {
        console.error('Failed to create Supabase client:', error);
        return createStubClient();
    }
}

export function getSupabaseClient(): SupabaseClient {
    if (supabaseInstance) {
        return supabaseInstance;
    }
    supabaseInstance = createClient();
    return supabaseInstance;
}

/**
 * Export singleton instance (never null - uses stub when not configured)
 */
export const supabase = getSupabaseClient();

/**
 * Check if using real Supabase (not stub)
 */
export function isSupabaseReal(): boolean {
    return isSupabaseConfigured();
}

/**
 * Reset singleton (useful for testing)
 */
export function resetSupabaseClient() {
    supabaseInstance = null;
}

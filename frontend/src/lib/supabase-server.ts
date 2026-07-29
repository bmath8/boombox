import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env, isSupabaseConfigured } from './env';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase server client
 * Returns null if Supabase is not configured
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
    if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase not configured for server-side operations');
        return null;
    }

    const cookieStore = await cookies();

    return createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL!,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch {
                        // Ignore errors in Server Components
                    }
                },
            },
        }
    );
}

/**
 * Gets the Supabase URL (with fallback for build time)
 */
export function getSupabaseUrl(): string {
    return env.NEXT_PUBLIC_SUPABASE_URL || '';
}

/**
 * Gets the Supabase anon key (with fallback for build time)
 */
export function getSupabaseAnonKey(): string {
    return env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

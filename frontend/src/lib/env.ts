import { z } from 'zod';

/**
 * Environment Variable Validation Schema
 * - Required vars throw errors in production
 * - Missing vars in development show warnings but don't crash
 */

const envSchema = z.object({
    // Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),

    // WebSocket Configuration (optional)
    NEXT_PUBLIC_WS_URL: z.string().url().refine(
        (url) => url.startsWith('ws://') || url.startsWith('wss://'),
        { message: 'Must start with ws:// or wss://' }
    ).optional(),

    // Spotify OAuth Configuration
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID: z.string().min(1).optional(),
    SPOTIFY_CLIENT_SECRET: z.string().min(1).optional(),
    NEXT_PUBLIC_SPOTIFY_REDIRECT_URI: z.string().url().optional(),

    // Node Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

// Default/placeholder values for when env vars are missing
const defaults: Partial<Env> = {
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID: '',
    NEXT_PUBLIC_SPOTIFY_REDIRECT_URI: '',
    NODE_ENV: 'development',
};

/**
 * Validates environment variables and returns typed config
 * Won't crash the app but will log warnings
 */
export function validateEnv(): Env {
    const rawEnv = {
        NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
        NEXT_PUBLIC_WS_URL: process.env['NEXT_PUBLIC_WS_URL'],
        NEXT_PUBLIC_SPOTIFY_CLIENT_ID: process.env['NEXT_PUBLIC_SPOTIFY_CLIENT_ID'],
        SPOTIFY_CLIENT_SECRET: process.env['SPOTIFY_CLIENT_SECRET'],
        NEXT_PUBLIC_SPOTIFY_REDIRECT_URI: process.env['NEXT_PUBLIC_SPOTIFY_REDIRECT_URI'],
        NODE_ENV: process.env['NODE_ENV'],
    };

    const parsed = envSchema.safeParse(rawEnv);

    if (!parsed.success) {
        console.warn('⚠️ Environment variable validation issues:', parsed.error.format());
    }

    // Check for missing required vars and warn
    const missingVars: string[] = [];

    if (!rawEnv.NEXT_PUBLIC_SUPABASE_URL) {
        missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    if (!rawEnv.NEXT_PUBLIC_SPOTIFY_CLIENT_ID) {
        missingVars.push('NEXT_PUBLIC_SPOTIFY_CLIENT_ID');
    }
    if (!rawEnv.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI) {
        missingVars.push('NEXT_PUBLIC_SPOTIFY_REDIRECT_URI');
    }

    if (missingVars.length > 0) {
        console.warn(
            `⚠️ Missing environment variables: ${missingVars.join(', ')}\n` +
            `   Login/OAuth features will not work.\n` +
            `   Please set these in your .env.local file or Vercel dashboard.`
        );
    }

    // Return parsed data with defaults for missing values
    return {
        ...defaults,
        ...parsed.data,
    } as Env;
}

/**
 * Validated environment variables
 * Use this instead of process.env for type safety
 */
export const env = validateEnv();

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
    return !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Check if Spotify OAuth is properly configured
 */
export function isSpotifyConfigured(): boolean {
    return !!(env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID && env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI);
}

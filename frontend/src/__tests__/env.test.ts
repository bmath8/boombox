import { validateEnv } from '../lib/env';

describe('Environment Variable Validation', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        // Create a mutable copy of process.env
        process.env = { ...originalEnv } as NodeJS.ProcessEnv;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should validate correct environment variables', () => {
        (process.env as Record<string, string>)['NEXT_PUBLIC_SUPABASE_URL'] = 'https://example.supabase.co';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-key';
        (process.env as Record<string, string>)['NEXT_PUBLIC_WS_URL'] = 'wss://example.com';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_CLIENT_ID'] = 'test-spotify-client-id';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_REDIRECT_URI'] = 'http://localhost:3000/auth/callback/spotify';
        (process.env as Record<string, string>)['NODE_ENV'] = 'test';

        const env = validateEnv();
        expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://example.supabase.co');
        expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-key');
        expect(env.NEXT_PUBLIC_WS_URL).toBe('wss://example.com');
    });

    it('should throw error for invalid URL', () => {
        (process.env as Record<string, string>)['NEXT_PUBLIC_SUPABASE_URL'] = 'invalid-url';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-key';
        (process.env as Record<string, string>)['NEXT_PUBLIC_WS_URL'] = 'wss://example.com';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_CLIENT_ID'] = 'test-spotify-client-id';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_REDIRECT_URI'] = 'http://localhost:3000/auth/callback/spotify';

        expect(() => validateEnv()).toThrow();
    });

    it('should throw error for missing required variable', () => {
        delete (process.env as Record<string, string | undefined>)['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
        (process.env as Record<string, string>)['NEXT_PUBLIC_SUPABASE_URL'] = 'https://example.supabase.co';
        (process.env as Record<string, string>)['NEXT_PUBLIC_WS_URL'] = 'wss://example.com';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_CLIENT_ID'] = 'test-spotify-client-id';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_REDIRECT_URI'] = 'http://localhost:3000/auth/callback/spotify';

        expect(() => validateEnv()).toThrow();
    });

    it('should validate WebSocket URL protocol', () => {
        (process.env as Record<string, string>)['NEXT_PUBLIC_SUPABASE_URL'] = 'https://example.supabase.co';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-key';
        (process.env as Record<string, string>)['NEXT_PUBLIC_WS_URL'] = 'http://example.com'; // Invalid protocol
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_CLIENT_ID'] = 'test-spotify-client-id';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_REDIRECT_URI'] = 'http://localhost:3000/auth/callback/spotify';

        expect(() => validateEnv()).toThrow();
    });
});

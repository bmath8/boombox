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

    // validateEnv() is deliberately non-fatal (see lib/env.ts: "Won't crash the app but will log
    // warnings"), so invalid/missing config is reported via console.warn and invalid values are dropped.
    it('should warn and drop an invalid URL', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        (process.env as Record<string, string>)['NEXT_PUBLIC_SUPABASE_URL'] = 'invalid-url';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-key';
        (process.env as Record<string, string>)['NEXT_PUBLIC_WS_URL'] = 'wss://example.com';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_CLIENT_ID'] = 'test-spotify-client-id';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_REDIRECT_URI'] = 'http://localhost:3000/auth/callback/spotify';

        let env!: ReturnType<typeof validateEnv>;
        expect(() => { env = validateEnv(); }).not.toThrow();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('validation issues'), expect.anything());
        expect(env.NEXT_PUBLIC_SUPABASE_URL).not.toBe('invalid-url');
        warn.mockRestore();
    });

    it('should warn about a missing required variable', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        delete (process.env as Record<string, string | undefined>)['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
        (process.env as Record<string, string>)['NEXT_PUBLIC_SUPABASE_URL'] = 'https://example.supabase.co';
        (process.env as Record<string, string>)['NEXT_PUBLIC_WS_URL'] = 'wss://example.com';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_CLIENT_ID'] = 'test-spotify-client-id';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_REDIRECT_URI'] = 'http://localhost:3000/auth/callback/spotify';

        let env!: ReturnType<typeof validateEnv>;
        expect(() => { env = validateEnv(); }).not.toThrow();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Missing environment variables: NEXT_PUBLIC_SUPABASE_ANON_KEY'));
        expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeFalsy();
        warn.mockRestore();
    });

    it('should reject a non-ws WebSocket URL protocol', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        (process.env as Record<string, string>)['NEXT_PUBLIC_SUPABASE_URL'] = 'https://example.supabase.co';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-key';
        (process.env as Record<string, string>)['NEXT_PUBLIC_WS_URL'] = 'http://example.com'; // Invalid protocol
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_CLIENT_ID'] = 'test-spotify-client-id';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_REDIRECT_URI'] = 'http://localhost:3000/auth/callback/spotify';

        let env!: ReturnType<typeof validateEnv>;
        expect(() => { env = validateEnv(); }).not.toThrow();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('validation issues'), expect.anything());
        expect(env.NEXT_PUBLIC_WS_URL).not.toBe('http://example.com');
        warn.mockRestore();
    });
});

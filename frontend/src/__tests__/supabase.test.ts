import { getSupabaseClient, resetSupabaseClient, supabase } from '../lib/supabase';

// Mock env
jest.mock('../lib/env', () => ({
    env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    },
}));

// Mock createBrowserClient
jest.mock('@supabase/ssr', () => ({
    createBrowserClient: jest.fn(() => ({
        auth: {
            getSession: jest.fn(),
        },
    })),
}));

describe('Supabase Singleton', () => {
    beforeEach(() => {
        resetSupabaseClient();
    });

    it('should return the same instance on multiple calls', () => {
        const client1 = getSupabaseClient();
        const client2 = getSupabaseClient();

        expect(client1).toBe(client2);
    });

    it('should create a new instance if reset', () => {
        const client1 = getSupabaseClient();
        resetSupabaseClient();
        const client2 = getSupabaseClient();

        expect(client1).not.toBe(client2);
    });

    it('should export a default singleton instance', () => {
        expect(supabase).toBeDefined();
        // The exported 'supabase' const is initialized at module load time.
        // Since we call resetSupabaseClient() in beforeEach, getSupabaseClient()
        // returns a NEW instance, which won't match the originally exported 'supabase'.
        // So we just check that 'supabase' is an object with the expected shape.
        expect(supabase).toHaveProperty('auth');
    });
});

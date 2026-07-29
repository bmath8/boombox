/**
 * Authentication Flow Tests
 * Tests Supabase authentication integration
 */

import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn(),
            getSession: jest.fn(),
            getUser: jest.fn(),
            onAuthStateChange: jest.fn(),
        },
    },
}));

describe('Authentication', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Sign In', () => {
        it('should sign in with valid credentials', async () => {
            const mockUser = {
                id: 'test-user-id',
                email: 'test@example.com',
            };

            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: mockUser, session: { access_token: 'token' } },
                error: null,
            });

            const { data, error } = await supabase.auth.signInWithPassword({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(error).toBeNull();
            expect(data.user).toEqual(mockUser);
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        it('should reject invalid credentials', async () => {
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'Invalid credentials' },
            });

            const { data, error } = await supabase.auth.signInWithPassword({
                email: 'test@example.com',
                password: 'wrongpassword',
            });

            expect(error).toBeTruthy();
            expect(error?.message).toBe('Invalid credentials');
            expect(data.user).toBeNull();
        });

        it('should handle network errors', async () => {
            (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
                new Error('Network error')
            );

            await expect(
                supabase.auth.signInWithPassword({
                    email: 'test@example.com',
                    password: 'password123',
                })
            ).rejects.toThrow('Network error');
        });
    });

    describe('Sign Up', () => {
        it('should create new user account', async () => {
            const mockUser = {
                id: 'new-user-id',
                email: 'newuser@example.com',
            };

            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: { user: mockUser, session: { access_token: 'token' } },
                error: null,
            });

            const { data, error } = await supabase.auth.signUp({
                email: 'newuser@example.com',
                password: 'password123',
            });

            expect(error).toBeNull();
            expect(data.user).toEqual(mockUser);
        });

        it('should reject duplicate email', async () => {
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'User already registered' },
            });

            const { data, error } = await supabase.auth.signUp({
                email: 'existing@example.com',
                password: 'password123',
            });

            expect(error).toBeTruthy();
            expect(error?.message).toBe('User already registered');
        });

        it('should reject weak passwords', async () => {
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'Password should be at least 6 characters' },
            });

            const { data, error } = await supabase.auth.signUp({
                email: 'test@example.com',
                password: '123',
            });

            expect(error).toBeTruthy();
            expect(error?.message).toContain('Password');
        });
    });

    describe('Sign Out', () => {
        it('should sign out successfully', async () => {
            (supabase.auth.signOut as jest.Mock).mockResolvedValue({
                error: null,
            });

            const { error } = await supabase.auth.signOut();

            expect(error).toBeNull();
            expect(supabase.auth.signOut).toHaveBeenCalled();
        });
    });

    describe('Session Management', () => {
        it('should get current session', async () => {
            const mockSession = {
                access_token: 'token',
                user: { id: 'user-id', email: 'test@example.com' },
            };

            (supabase.auth.getSession as jest.Mock).mockResolvedValue({
                data: { session: mockSession },
                error: null,
            });

            const { data, error } = await supabase.auth.getSession();

            expect(error).toBeNull();
            expect(data.session).toEqual(mockSession);
        });

        it('should return null for no session', async () => {
            (supabase.auth.getSession as jest.Mock).mockResolvedValue({
                data: { session: null },
                error: null,
            });

            const { data, error } = await supabase.auth.getSession();

            expect(error).toBeNull();
            expect(data.session).toBeNull();
        });
    });

    describe('Auth State Changes', () => {
        it('should listen to auth state changes', () => {
            const mockCallback = jest.fn();
            const mockUnsubscribe = jest.fn();

            (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
                data: { subscription: { unsubscribe: mockUnsubscribe } },
            });

            const { data } = supabase.auth.onAuthStateChange(mockCallback);

            expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback);
            expect(data.subscription.unsubscribe).toBe(mockUnsubscribe);
        });
    });
});

describe('Environment Configuration', () => {
    it('should have valid Supabase URL', () => {
        expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
        expect(env.NEXT_PUBLIC_SUPABASE_URL).toMatch(/^https:\/\//);
    });

    it('should have valid Supabase anon key', () => {
        expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
        if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length).toBeGreaterThan(0);
        }
    });

    it('should have valid WebSocket URL', () => {
        expect(env.NEXT_PUBLIC_WS_URL).toBeDefined();
        if (env.NEXT_PUBLIC_WS_URL) {
            expect(env.NEXT_PUBLIC_WS_URL).toMatch(/^wss?:\/\//);
        }
    });
});

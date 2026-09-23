/**
 * @jest-environment node
 */
/**
 * Spotify OAuth Callback Route Tests
 * Tests OAuth flow and token exchange
 */

import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock Supabase server client (the route uses @/lib/supabase-server, built on @supabase/ssr;
// the deprecated @supabase/auth-helpers-nextjs package is no longer used).
// `mock` prefix lets jest.mock's hoisted factory reference it.
const mockCreateServerSupabaseClient = jest.fn();
jest.mock('@/lib/supabase-server', () => ({
    createServerSupabaseClient: () => mockCreateServerSupabaseClient(),
}));
// Keep the old name so the test bodies below read unchanged.
const createRouteHandlerClient = mockCreateServerSupabaseClient;

// Mock CSRF state validation (tested separately below via mockValidateOAuthState)
const mockValidateOAuthState = jest.fn();
jest.mock('@/lib/oauth-state', () => ({
    validateOAuthState: (state: string | null) => mockValidateOAuthState(state),
}));

// Mock next/headers
jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('Spotify OAuth Callback Route', () => {
    const mockOrigin = 'http://localhost:3000';
    const mockCode = 'spotify_auth_code_123';
    const mockAccessToken = 'spotify_access_token_456';
    const mockRefreshToken = 'spotify_refresh_token_789';

    beforeEach(() => {
        jest.clearAllMocks();
        mockValidateOAuthState.mockResolvedValue(undefined);
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_CLIENT_ID'] = 'test_client_id';
        (process.env as Record<string, string>)['SPOTIFY_CLIENT_SECRET'] = 'test_client_secret';
        (process.env as Record<string, string>)['NEXT_PUBLIC_SPOTIFY_REDIRECT_URI'] = 'http://localhost:3000/api/auth/callback/spotify';
    });

    const createMockRequest = (params: Record<string, string>) => {
        const url = new URL(`${mockOrigin}/api/auth/callback/spotify`);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        return new NextRequest(url.toString());
    };

    describe('Successful OAuth Flow', () => {
        it('should exchange code for tokens and redirect to radio', async () => {
            const mockSupabase = {
                auth: {
                    getSession: jest.fn().mockResolvedValue({
                        data: {
                            session: {
                                user: { id: 'user123' },
                                access_token: 'supabase_token',
                            },
                        },
                    }),
                    updateUser: jest.fn().mockResolvedValue({
                        data: { user: {} },
                        error: null,
                    }),
                },
            };

            (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    access_token: mockAccessToken,
                    refresh_token: mockRefreshToken,
                    expires_in: 3600,
                }),
            });

            const request = createMockRequest({ code: mockCode });
            const response = await GET(request);

            // Verify token exchange request
            expect(global.fetch).toHaveBeenCalledWith(
                'https://accounts.spotify.com/api/token',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }),
                })
            );

            // Verify user update with Spotify tokens
            expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
                data: {
                    spotify_access_token: mockAccessToken,
                    spotify_refresh_token: mockRefreshToken,
                    spotify_expires_at: expect.any(Number),
                },
            });

            // Verify redirect to radio page
            expect(response.headers.get('location')).toBe(`${mockOrigin}/radio`);
        });

        it('should include correct authorization header for token exchange', async () => {
            const mockSupabase = {
                auth: {
                    getSession: jest.fn().mockResolvedValue({
                        data: { session: { user: { id: 'user123' } } },
                    }),
                    updateUser: jest.fn().mockResolvedValue({
                        data: { user: {} },
                        error: null,
                    }),
                },
            };

            (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    access_token: mockAccessToken,
                    refresh_token: mockRefreshToken,
                    expires_in: 3600,
                }),
            });

            const request = createMockRequest({ code: mockCode });
            await GET(request);

            // The route reads credentials from the validated `env` snapshot (lib/env.ts), which is
            // captured at module load from jest.setup.js — not from process.env at request time.
            const expectedAuth = `Basic ${Buffer.from(
                `test-spotify-client-id:test-spotify-client-secret`
            ).toString('base64')}`;

            expect(global.fetch).toHaveBeenCalledWith(
                'https://accounts.spotify.com/api/token',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: expectedAuth,
                    }),
                })
            );
        });
    });

    describe('Error Handling', () => {
        it('should redirect to error page when OAuth error is present', async () => {
            const request = createMockRequest({ error: 'access_denied' });
            const response = await GET(request);

            expect(response.headers.get('location')).toBe(
                `${mockOrigin}/auth/error?error=access_denied`
            );
        });

        it('should redirect to error page when code is missing', async () => {
            const request = createMockRequest({});
            const response = await GET(request);

            expect(response.headers.get('location')).toBe(
                `${mockOrigin}/auth/error?error=no_code`
            );
        });

        it('should redirect with csrf_detected when state validation fails', async () => {
            mockValidateOAuthState.mockRejectedValue(new Error('State mismatch'));

            const request = createMockRequest({ code: mockCode, state: 'forged' });
            const response = await GET(request);

            expect(mockValidateOAuthState).toHaveBeenCalledWith('forged');
            expect(global.fetch).not.toHaveBeenCalled();
            expect(response.headers.get('location')).toBe(
                `${mockOrigin}/auth/error?error=csrf_detected`
            );
        });

        it('should handle token exchange failure', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 400,
            });

            const request = createMockRequest({ code: mockCode });
            const response = await GET(request);

            expect(response.headers.get('location')).toBe(
                `${mockOrigin}/auth/error?error=token_exchange_failed`
            );
        });

        it('should handle network errors during token exchange', async () => {
            (global.fetch as jest.Mock).mockRejectedValue(
                new Error('Network error')
            );

            const request = createMockRequest({ code: mockCode });
            const response = await GET(request);

            expect(response.headers.get('location')).toBe(
                `${mockOrigin}/auth/error?error=token_exchange_failed`
            );
        });

        it('should handle Supabase session errors', async () => {
            const mockSupabase = {
                auth: {
                    getSession: jest.fn().mockRejectedValue(
                        new Error('Session error')
                    ),
                },
            };

            (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    access_token: mockAccessToken,
                    refresh_token: mockRefreshToken,
                    expires_in: 3600,
                }),
            });

            const request = createMockRequest({ code: mockCode });
            const response = await GET(request);

            expect(response.headers.get('location')).toBe(
                `${mockOrigin}/auth/error?error=token_exchange_failed`
            );
        });
    });

    describe('Session Handling', () => {
        it('should handle missing session gracefully', async () => {
            const mockSupabase = {
                auth: {
                    getSession: jest.fn().mockResolvedValue({
                        data: { session: null },
                    }),
                    updateUser: jest.fn(),
                },
            };

            (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    access_token: mockAccessToken,
                    refresh_token: mockRefreshToken,
                    expires_in: 3600,
                }),
            });

            const request = createMockRequest({ code: mockCode });
            const response = await GET(request);

            // Should not attempt to update user if no session
            expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();

            // Should still redirect to radio
            expect(response.headers.get('location')).toBe(`${mockOrigin}/radio`);
        });
    });

    describe('Token Expiration Calculation', () => {
        it('should calculate correct expiration timestamp', async () => {
            const mockSupabase = {
                auth: {
                    getSession: jest.fn().mockResolvedValue({
                        data: { session: { user: { id: 'user123' } } },
                    }),
                    updateUser: jest.fn().mockResolvedValue({
                        data: { user: {} },
                        error: null,
                    }),
                },
            };

            (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

            const expiresIn = 3600; // 1 hour
            const beforeTime = Date.now();

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    access_token: mockAccessToken,
                    refresh_token: mockRefreshToken,
                    expires_in: expiresIn,
                }),
            });

            const request = createMockRequest({ code: mockCode });
            await GET(request);

            const afterTime = Date.now();

            const updateCall = mockSupabase.auth.updateUser.mock.calls[0][0];
            const expiresAt = updateCall.data.spotify_expires_at;

            // Should be approximately current time + expires_in seconds
            expect(expiresAt).toBeGreaterThanOrEqual(beforeTime + expiresIn * 1000);
            expect(expiresAt).toBeLessThanOrEqual(afterTime + expiresIn * 1000);
        });
    });
});

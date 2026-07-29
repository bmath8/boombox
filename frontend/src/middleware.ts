import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { env, isSupabaseConfigured } from './lib/env';
import { logger } from './lib/logger';
import { redisAuthLimiter, redisApiLimiter } from './lib/redis-rate-limit';

export async function middleware(request: NextRequest) {
    // 1. Rate Limiting Security Check
    // Skip rate limiting for WebSocket connections (handled by WS server)
    if (request.nextUrl.pathname.startsWith('/api/socket') || request.nextUrl.pathname.includes('socket')) {
        return NextResponse.next();
    }

    // Only throttle mutating auth requests, not GET page loads. A login-screen
    // navigation is not a brute-force attempt; rate-limiting it locked out demo
    // traffic (5/15min/IP) while providing no real protection — the actual sign-in
    // goes client->Supabase, never through here.
    if (request.method !== 'GET' && (request.nextUrl.pathname.startsWith('/auth') || request.nextUrl.pathname === '/login')) {
        try {
            const result = await redisAuthLimiter(request);
            if (result) return result;
        } catch (error) {
            // Log but don't block - rate limiting failure shouldn't break auth
            logger.error('Auth rate limiting error:', error);
        }
    }

    if (request.nextUrl.pathname.startsWith('/api')) {
        try {
            const result = await redisApiLimiter(request);
            if (result) return result;
        } catch (error) {
            // Log but don't block - rate limiting failure shouldn't break API
            logger.error('API rate limiting error:', error);
        }
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Skip Supabase auth check if not configured
    if (!isSupabaseConfigured()) {
        // Allow all requests when Supabase is not configured (dev mode)
        return response;
    }

    const supabase = createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL || '',
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Public paths that don't require authentication
    const isPublicPath = request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.includes('socket') ||
        request.nextUrl.pathname === '/sw.js' ||
        request.nextUrl.pathname.startsWith('/workbox-') ||
        request.nextUrl.pathname === '/manifest.json';

    // Debug logging
    logger.info('Middleware check', {
        path: request.nextUrl.pathname,
        hasUser: !!user,
        userId: user?.id,
    });

    // Redirect unauthenticated users to login
    if (!user && !isPublicPath) {
        logger.info('No user, redirecting to /login');
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - auth/callback (auth callback route)
         */
        '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

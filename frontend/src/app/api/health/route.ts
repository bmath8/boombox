/**
 * Health Check API Route
 * Provides system health status for monitoring
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/env';
import { healthCheckLimiter } from '@/middleware/rate-limit';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const rateLimitResult = healthCheckLimiter(request);
    if (rateLimitResult) return rateLimitResult;

    const startTime = Date.now();

    try {
        let dbHealthy = false;
        let dbError: string | null = null;

        // Check database connection only if configured
        if (isSupabaseConfigured() && supabase) {
            const { error } = await supabase
                .from('users')
                .select('count')
                .limit(1)
                .single();

            dbHealthy = !error;
            dbError = error?.message || null;
        } else {
            dbError = 'Supabase not configured';
        }

        const responseTime = Date.now() - startTime;

        // Overall health status
        const healthy = dbHealthy || !isSupabaseConfigured(); // Healthy if DB works or not configured

        return NextResponse.json({
            status: healthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            checks: {
                database: {
                    status: dbHealthy ? 'up' : isSupabaseConfigured() ? 'down' : 'not_configured',
                    responseTime: `${responseTime}ms`,
                    error: dbError,
                },
                application: {
                    status: 'up',
                    version: '1.0.0',
                    environment: env.NODE_ENV,
                },
            },
        }, {
            status: healthy ? 200 : 503,
        });
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        }, {
            status: 503,
        });
    }
}

/**
 * Server Time API Endpoint
 * Used by RadioSyncEngine for time synchronization
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const timestamp = Date.now();

    return NextResponse.json(
        {
            timestamp,
            iso: new Date(timestamp).toISOString(),
        },
        {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Access-Control-Allow-Origin': '*',
            },
        }
    );
}

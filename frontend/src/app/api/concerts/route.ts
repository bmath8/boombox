
import { NextResponse } from 'next/server';

/**
 * Concert Discovery API
 * 
 * Fetches upcoming events from Ticketmaster API.
 * Falls back to realistic demo data if no API key is configured.
 */

const TICKETMASTER_API_KEY = process.env['TICKETMASTER_API_KEY'];
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const artist = searchParams.get('artist');
    const city = searchParams.get('city');

    try {
        // 1. Check for API Key
        if (!TICKETMASTER_API_KEY) {
            console.warn('[API] Concerts: No TICKETMASTER_API_KEY found. Serving demo data.');
            return NextResponse.json(getDemoEvents(artist, city));
        }

        // 2. Real API Call
        const queryParams = new URLSearchParams({
            apikey: TICKETMASTER_API_KEY,
            keyword: artist || '',
            city: city || '',
            classificationName: 'Music',
            sort: 'date,asc',
            size: '10'
        });

        const response = await fetch(`${TICKETMASTER_BASE_URL}?${queryParams}`);

        if (!response.ok) {
            throw new Error(`Ticketmaster API error: ${response.statusText}`);
        }

        const data = await response.json();
        const events = data._embedded?.events?.map(mapTicketmasterEvent) || [];

        return NextResponse.json(events);

    } catch (error) {
        console.error('[API] Concerts Error:', error);
        // Fallback to demo data on error to keep UI alive
        return NextResponse.json(getDemoEvents(artist, city));
    }
}

// --- Helpers ---

function mapTicketmasterEvent(tmEvent: any) {
    return {
        id: tmEvent.id,
        artist: tmEvent.name,
        date: tmEvent.dates?.start?.localDate,
        venue: tmEvent._embedded?.venues?.[0]?.name || 'Unknown Venue',
        city: tmEvent._embedded?.venues?.[0]?.city?.name || 'Unknown City',
        ticketUrl: tmEvent.url,
        image: tmEvent.images?.find((img: any) => img.ratio === '16_9')?.url || tmEvent.images?.[0]?.url
    };
}

function getDemoEvents(artist?: string | null, city?: string | null) {
    const baseArtist = artist || 'The Midnight';

    return [
        {
            id: 'demo-1',
            artist: baseArtist,
            date: '2025-10-15',
            venue: 'Terminal 5',
            city: 'New York, NY',
            ticketUrl: '#',
            image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
            isDemo: true
        },
        {
            id: 'demo-2',
            artist: baseArtist,
            date: '2025-11-20',
            venue: 'The Wiltern',
            city: 'Los Angeles, CA',
            ticketUrl: '#',
            image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
            isDemo: true
        },
        {
            id: 'demo-3',
            artist: baseArtist,
            date: '2025-12-05',
            venue: 'O2 Academy',
            city: 'London, UK',
            ticketUrl: '#',
            image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
            isDemo: true
        }
    ];
}

'use client';

import { useState, useCallback, useEffect } from 'react';

interface ConcertEvent {
    id: string;
    artist: string;
    date: string;
    venue: string;
    city: string;
    ticketUrl: string;
    image?: string;
}

/**
 * Hook for Concert Discovery
 * 
 * Finds upcoming shows for user's favorite artists
 * Location-based filtering support
 */
export function useConcertDiscovery() {
    const [events, setEvents] = useState<ConcertEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<string | null>(null);

    const detectLocation = useCallback(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Reverse geocoding would happen here
                    // For now mock it
                    setUserLocation('New York, NY');
                    console.log('[Concerts] Location detected:', position.coords);
                },
                (error) => {
                    console.error('[Concerts] Location error:', error);
                }
            );
        }
    }, []);

    const fetchConcerts = useCallback(async (artistIds: string[]) => {
        setIsLoading(true);

        try {
            // For now, we search for the first artist or a default
            // In a real app we might Promise.all search for multiple
            const primaryArtist = 'The Weeknd'; // TODO: Get from artistIds
            const params = new URLSearchParams({ artist: primaryArtist });

            if (userLocation) {
                const city = userLocation.split(',')[0] || '';
                params.append('city', city);
            }

            const response = await fetch(`/api/concerts?${params}`);
            if (!response.ok) throw new Error('Failed to fetch concerts');

            const data = await response.json();
            setEvents(data);

        } catch (error) {
            console.error('[Concerts] Fetch failed:', error);
            // Keep empty or show specific error state
        } finally {
            setIsLoading(false);
        }
    }, [userLocation]);

    useEffect(() => {
        detectLocation();
    }, [detectLocation]);

    return {
        events,
        isLoading,
        userLocation,
        fetchConcerts,
        detectLocation,
    };
}

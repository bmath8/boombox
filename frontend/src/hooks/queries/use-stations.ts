import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';
import { handleError } from '@/lib/error-handler';
import { showSuccessToast } from '@/lib/toast-utils';
import type { Station } from '@/lib/types';

/**
 * Query Hooks for Stations
 *
 * Provides data fetching and mutations for radio stations.
 * Uses React Query for caching, background refetching, and optimistic updates.
 */

/**
 * Fetch all live stations
 */
export function useStations() {
    return useQuery({
        queryKey: queryKeys.stations.list({ status: 'live' }),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('radio_stations')
                .select('*')
                .eq('status', 'live')
                .order('listener_count', { ascending: false });

            if (error) throw error;
            return data as Station[];
        },
        staleTime: 30 * 1000, // 30 seconds (stations are dynamic)
    });
}

/**
 * Fetch a specific station by ID
 */
export function useStation(stationId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.stations.detail(stationId || ''),
        queryFn: async () => {
            if (!stationId) return null;

            const { data, error } = await supabase
                .from('radio_stations')
                .select('*')
                .eq('station_id', stationId)
                .single();

            if (error) throw error;
            return data as Station;
        },
        enabled: !!stationId, // Only run if stationId is provided
    });
}

/**
 * Fetch user's stations (as broadcaster)
 */
export function useMyStations() {
    return useQuery({
        queryKey: queryKeys.stations.list({ my: true }),
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('radio_stations')
                .select('*')
                .eq('broadcaster_id', user.id)
                .order('went_live_at', { ascending: false });

            if (error) throw error;
            return data as Station[];
        },
    });
}

/**
 * Create a new station (mutation)
 */
export function useCreateStation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (stationName: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('radio_stations')
                .insert({
                    station_name: stationName,
                    broadcaster_id: user.id,
                    status: 'live',
                    went_live_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            return data as Station;
        },
        onSuccess: (station) => {
            // Invalidate station queries to refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.stations.all });

            showSuccessToast('Station created!', {
                description: `${station.station_name} is now live`,
            });
        },
        onError: (error) => {
            handleError(error, 'Create Station');
        },
    });
}

/**
 * Update station status (mutation)
 */
export function useUpdateStation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ stationId, updates }: { stationId: string; updates: Partial<Station> }) => {
            const { data, error } = await supabase
                .from('radio_stations')
                .update(updates)
                .eq('station_id', stationId)
                .select()
                .single();

            if (error) throw error;
            return data as Station;
        },
        onSuccess: (station) => {
            // Update the specific station in cache
            queryClient.setQueryData(
                queryKeys.stations.detail(station.station_id),
                station
            );

            // Invalidate station lists
            queryClient.invalidateQueries({ queryKey: queryKeys.stations.lists() });
        },
        onError: (error) => {
            handleError(error, 'Update Station');
        },
    });
}

/**
 * Delete station (mutation)
 */
export function useDeleteStation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (stationId: string) => {
            const { error } = await supabase
                .from('radio_stations')
                .delete()
                .eq('station_id', stationId);

            if (error) throw error;
            return stationId;
        },
        onSuccess: (stationId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: queryKeys.stations.detail(stationId) });

            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: queryKeys.stations.lists() });

            showSuccessToast('Station deleted');
        },
        onError: (error) => {
            handleError(error, 'Delete Station');
        },
    });
}

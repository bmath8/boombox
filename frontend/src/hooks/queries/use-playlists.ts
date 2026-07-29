import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';
import { handleError } from '@/lib/error-handler';
import { showSuccessToast } from '@/lib/toast-utils';

/**
 * Query Hooks for Playlists
 *
 * Provides data fetching and mutations for collaborative playlists.
 */

export interface Playlist {
    playlist_id: string;
    playlist_name: string;
    description?: string;
    theme: string;
    total_tracks: number;
    total_collaborators: number;
    total_plays: number;
    created_at: string;
}

/**
 * Fetch user's playlists
 */
export function usePlaylists() {
    return useQuery({
        queryKey: queryKeys.playlists.list({}),
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data: collaboratorData } = await supabase
                .from('playlist_collaborators')
                .select('playlist_id')
                .eq('user_id', user.id);

            if (!collaboratorData || collaboratorData.length === 0) return [];

            const playlistIds = collaboratorData.map(c => c.playlist_id);

            const { data, error } = await supabase
                .from('collaborative_playlists')
                .select('*')
                .in('playlist_id', playlistIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Playlist[];
        },
    });
}

/**
 * Fetch a specific playlist
 */
export function usePlaylist(playlistId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.playlists.detail(playlistId || ''),
        queryFn: async () => {
            if (!playlistId) return null;

            const { data, error } = await supabase
                .from('collaborative_playlists')
                .select('*')
                .eq('playlist_id', playlistId)
                .single();

            if (error) throw error;
            return data as Playlist;
        },
        enabled: !!playlistId,
    });
}

/**
 * Create a new playlist
 */
export function useCreatePlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (playlistData: {
            name: string;
            description?: string;
            theme: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: playlist, error } = await supabase
                .from('collaborative_playlists')
                .insert({
                    playlist_name: playlistData.name,
                    description: playlistData.description,
                    theme: playlistData.theme,
                })
                .select()
                .single();

            if (error) throw error;

            // Add user as collaborator
            await supabase
                .from('playlist_collaborators')
                .insert({
                    playlist_id: playlist.playlist_id,
                    user_id: user.id,
                    role: 'owner',
                });

            return playlist as Playlist;
        },
        onSuccess: (playlist) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all });

            showSuccessToast('Playlist created!', {
                description: `${playlist.playlist_name} is ready`,
            });
        },
        onError: (error) => {
            handleError(error, 'Create Playlist');
        },
    });
}

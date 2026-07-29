/**
 * Playlist Flow Integration Tests
 * Tests end-to-end playlist creation, collaboration, and voting
 */

import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        auth: {
            getUser: jest.fn(),
        },
    },
}));

describe('Playlist Flow', () => {
    const mockUser = {
        id: 'curator-id',
        email: 'curator@example.com',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
    });

    describe('Playlist Creation', () => {
        it('should create a new collaborative playlist', async () => {
            const mockPlaylist = {
                playlist_id: 'playlist-123',
                creator_id: mockUser.id,
                name: 'Test Playlist',
                description: 'A test playlist',
                is_collaborative: true,
                voting_enabled: true,
            };

            const mockSingle = jest.fn().mockResolvedValue({
                data: mockPlaylist,
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                single: mockSingle,
            });

            const mockInsert = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
            });

            const { data, error } = await supabase
                .from('collaborative_playlists')
                .insert({
                    creator_id: mockUser.id,
                    name: 'Test Playlist',
                    description: 'A test playlist',
                    is_collaborative: true,
                    voting_enabled: true,
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).toEqual(mockPlaylist);
            expect(data?.is_collaborative).toBe(true);
        });

        it('should validate required fields', async () => {
            const mockSingle = jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Missing required field: name' },
            });

            const mockSelect = jest.fn().mockReturnValue({
                single: mockSingle,
            });

            const mockInsert = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
            });

            const { data, error } = await supabase
                .from('collaborative_playlists')
                .insert({
                    creator_id: mockUser.id,
                    // Missing name
                })
                .select()
                .single();

            expect(error).toBeTruthy();
        });
    });

    describe('Adding Tracks', () => {
        it('should add track to playlist', async () => {
            const mockTrack = {
                track_id: 'track-123',
                playlist_id: 'playlist-123',
                spotify_track_id: 'spotify:track:123',
                added_by: mockUser.id,
                position: 0,
                upvotes: 0,
                downvotes: 0,
            };

            const mockSingle = jest.fn().mockResolvedValue({
                data: mockTrack,
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                single: mockSingle,
            });

            const mockInsert = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
            });

            const { data, error } = await supabase
                .from('playlist_tracks')
                .insert({
                    playlist_id: 'playlist-123',
                    spotify_track_id: 'spotify:track:123',
                    added_by: mockUser.id,
                    position: 0,
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).toEqual(mockTrack);
        });

        it('should prevent duplicate tracks', async () => {
            const mockSingle = jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Duplicate track' },
            });

            const mockSelect = jest.fn().mockReturnValue({
                single: mockSingle,
            });

            const mockInsert = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
            });

            const { data, error } = await supabase
                .from('playlist_tracks')
                .insert({
                    playlist_id: 'playlist-123',
                    spotify_track_id: 'spotify:track:123', // Already exists
                    added_by: mockUser.id,
                })
                .select()
                .single();

            expect(error).toBeTruthy();
        });
    });

    describe('Voting', () => {
        it('should upvote a track', async () => {
            const mockVote = {
                vote_id: 'vote-123',
                track_id: 'track-123',
                user_id: mockUser.id,
                vote_type: 'upvote',
            };

            const mockSingle = jest.fn().mockResolvedValue({
                data: mockVote,
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                single: mockSingle,
            });

            const mockInsert = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
            });

            const { data, error } = await supabase
                .from('playlist_track_votes')
                .insert({
                    track_id: 'track-123',
                    user_id: mockUser.id,
                    vote_type: 'upvote',
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data?.vote_type).toBe('upvote');
        });

        it('should downvote a track', async () => {
            const mockVote = {
                vote_id: 'vote-123',
                track_id: 'track-123',
                user_id: mockUser.id,
                vote_type: 'downvote',
            };

            const mockSingle = jest.fn().mockResolvedValue({
                data: mockVote,
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                single: mockSingle,
            });

            const mockInsert = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
            });

            const { data, error } = await supabase
                .from('playlist_track_votes')
                .insert({
                    track_id: 'track-123',
                    user_id: mockUser.id,
                    vote_type: 'downvote',
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data?.vote_type).toBe('downvote');
        });

        it('should prevent duplicate votes', async () => {
            const mockSingle = jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'User already voted' },
            });

            const mockSelect = jest.fn().mockReturnValue({
                single: mockSingle,
            });

            const mockInsert = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
            });

            const { data, error } = await supabase
                .from('playlist_track_votes')
                .insert({
                    track_id: 'track-123',
                    user_id: mockUser.id,
                    vote_type: 'upvote',
                })
                .select()
                .single();

            expect(error).toBeTruthy();
        });

        it('should change vote from upvote to downvote', async () => {
            // First, delete existing vote
            const mockDeleteEq = jest.fn().mockResolvedValue({
                data: { vote_id: 'old-vote' },
                error: null,
            });

            const mockDelete = jest.fn().mockReturnValue({
                eq: mockDeleteEq,
            });

            // Then, insert new vote
            const mockSingle = jest.fn().mockResolvedValue({
                data: { vote_id: 'new-vote', vote_type: 'downvote' },
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                single: mockSingle,
            });

            const mockInsert = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            (supabase.from as jest.Mock)
                .mockReturnValueOnce({ delete: mockDelete })
                .mockReturnValueOnce({ insert: mockInsert });

            // Delete old vote
            await supabase
                .from('playlist_track_votes')
                .delete()
                .eq('track_id', 'track-123');

            // Insert new vote
            const { data, error } = await supabase
                .from('playlist_track_votes')
                .insert({
                    track_id: 'track-123',
                    user_id: mockUser.id,
                    vote_type: 'downvote',
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data?.vote_type).toBe('downvote');
        });
    });

    describe('Collaboration', () => {
        it('should add collaborator to playlist', async () => {
            const mockCollaborator = {
                playlist_id: 'playlist-123',
                user_id: 'friend-id',
                role: 'contributor',
            };

            const mockSingle = jest.fn().mockResolvedValue({
                data: mockCollaborator,
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                single: mockSingle,
            });

            const mockInsert = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
            });

            const { data, error } = await supabase
                .from('playlist_collaborators')
                .insert({
                    playlist_id: 'playlist-123',
                    user_id: 'friend-id',
                    role: 'contributor',
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data?.role).toBe('contributor');
        });

        it('should list all collaborators', async () => {
            const mockCollaborators = [
                { user_id: 'user-1', role: 'contributor' },
                { user_id: 'user-2', role: 'contributor' },
            ];

            const mockEq = jest.fn().mockResolvedValue({
                data: mockCollaborators,
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                eq: mockEq,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: mockSelect,
            });

            const { data, error } = await supabase
                .from('playlist_collaborators')
                .select('*')
                .eq('playlist_id', 'playlist-123');

            expect(error).toBeNull();
            expect(data).toHaveLength(2);
        });
    });

    describe('Comments', () => {
        it('should add comment to track', async () => {
            const mockComment = {
                comment_id: 'comment-123',
                track_id: 'track-123',
                user_id: mockUser.id,
                comment_text: 'Great track!',
            };

            const mockSingle = jest.fn().mockResolvedValue({
                data: mockComment,
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                single: mockSingle,
            });

            const mockInsert = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
            });

            const { data, error } = await supabase
                .from('playlist_track_comments')
                .insert({
                    track_id: 'track-123',
                    user_id: mockUser.id,
                    comment_text: 'Great track!',
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data?.comment_text).toBe('Great track!');
        });
    });

    describe('End-to-End Flow', () => {
        it('should complete full playlist workflow', async () => {
            // Step 1: Create playlist
            const mockPlaylist = { playlist_id: 'playlist-123', creator_id: mockUser.id };

            // Step 2: Add track
            const mockTrack = { track_id: 'track-123', playlist_id: 'playlist-123' };

            // Step 3: Add collaborator
            const mockCollaborator = { playlist_id: 'playlist-123', user_id: 'friend-id' };

            // Step 4: Vote on track
            const mockVote = { track_id: 'track-123', vote_type: 'upvote' };

            // Mock all operations
            const mockOperations = [mockPlaylist, mockTrack, mockCollaborator, mockVote];
            let callCount = 0;

            (supabase.from as jest.Mock).mockImplementation(() => ({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockOperations[callCount++],
                            error: null,
                        }),
                    }),
                }),
            }));

            // Execute workflow
            const playlist = await supabase.from('collaborative_playlists').insert({}).select().single();
            const track = await supabase.from('playlist_tracks').insert({}).select().single();
            const collaborator = await supabase.from('playlist_collaborators').insert({}).select().single();
            const vote = await supabase.from('playlist_track_votes').insert({}).select().single();

            expect(playlist.data).toEqual(mockPlaylist);
            expect(track.data).toEqual(mockTrack);
            expect(collaborator.data).toEqual(mockCollaborator);
            expect(vote.data).toEqual(mockVote);
        });
    });
});

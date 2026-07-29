/**
 * Spotify API Tests
 * Tests for Spotify Web API integration
 */

import {
    searchTracks,
    getUserPlaylists,
    getPlaylistTracks,
    getRecommendations,
    playTrack,
} from '@/lib/spotify-api';

// Mock fetch
global.fetch = jest.fn();

describe('Spotify API', () => {
    const mockToken = 'mock-spotify-token';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('searchTracks', () => {
        it('should search for tracks successfully', async () => {
            const mockResponse = {
                tracks: {
                    items: [
                        {
                            id: 'track-1',
                            name: 'Test Track',
                            artists: [{ name: 'Test Artist', id: 'artist-1' }],
                            album: {
                                name: 'Test Album',
                                images: [{ url: 'https://example.com/image.jpg', height: 640, width: 640 }],
                            },
                            duration_ms: 180000,
                            uri: 'spotify:track:track-1',
                            preview_url: 'https://example.com/preview.mp3',
                        },
                    ],
                    total: 1,
                },
            };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const results = await searchTracks('test query', mockToken, 20);

            expect(results).toHaveLength(1);
            expect(results?.[0]?.name).toBe('Test Track');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/search'),
                expect.objectContaining({
                    headers: {
                        Authorization: `Bearer ${mockToken}`,
                    },
                })
            );
        });

        it('should handle API errors', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                statusText: 'Unauthorized',
            });

            await expect(searchTracks('test', mockToken)).rejects.toThrow('Spotify API error');
        });

        it('should include query parameters', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({ tracks: { items: [], total: 0 } }),
            });

            await searchTracks('test query', mockToken, 10);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('q=test+query'),
                expect.anything()
            );
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('type=track'),
                expect.anything()
            );
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('limit=10'),
                expect.anything()
            );
        });
    });

    describe('getUserPlaylists', () => {
        it('should fetch user playlists', async () => {
            const mockPlaylists = {
                items: [
                    {
                        id: 'playlist-1',
                        name: 'My Playlist',
                        description: 'Test playlist',
                        images: [{ url: 'https://example.com/playlist.jpg' }],
                        tracks: { total: 10, items: [] },
                        owner: { display_name: 'Test User' },
                    },
                ],
            };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockPlaylists,
            });

            const playlists = await getUserPlaylists(mockToken, 50);

            expect(playlists).toHaveLength(1);
            expect(playlists?.[0]?.name).toBe('My Playlist');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/me/playlists'),
                expect.anything()
            );
        });
    });

    describe('getPlaylistTracks', () => {
        it('should fetch playlist tracks', async () => {
            const mockData = {
                items: [
                    {
                        track: {
                            id: 'track-1',
                            name: 'Track 1',
                            artists: [{ name: 'Artist 1', id: 'artist-1' }],
                            album: { name: 'Album 1', images: [] },
                            duration_ms: 200000,
                            uri: 'spotify:track:track-1',
                            preview_url: null,
                        },
                    },
                ],
            };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockData,
            });

            const tracks = await getPlaylistTracks('playlist-1', mockToken);

            expect(tracks).toHaveLength(1);
            expect(tracks?.[0]?.name).toBe('Track 1');
        });
    });

    describe('getRecommendations', () => {
        it('should get track recommendations', async () => {
            const mockData = {
                tracks: [
                    {
                        id: 'rec-1',
                        name: 'Recommended Track',
                        artists: [{ name: 'Artist', id: 'artist-1' }],
                        album: { name: 'Album', images: [] },
                        duration_ms: 180000,
                        uri: 'spotify:track:rec-1',
                        preview_url: null,
                    },
                ],
            };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockData,
            });

            const recommendations = await getRecommendations(['track-1', 'track-2'], mockToken, 20);

            expect(recommendations).toHaveLength(1);
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/recommendations'),
                expect.anything()
            );
        });

        it('should limit seed tracks to 5', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({ tracks: [] }),
            });

            const seedTracks = ['1', '2', '3', '4', '5', '6', '7'];
            await getRecommendations(seedTracks, mockToken);

            const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
            const seedParam = new URL(callUrl).searchParams.get('seed_tracks');
            expect(seedParam?.split(',').length).toBeLessThanOrEqual(5);
        });
    });

    describe('playTrack', () => {
        it('should play a track on device', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 204,
            });

            await playTrack('spotify:track:123', 'device-id', mockToken, 0);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/me/player/play'),
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${mockToken}`,
                    }),
                    body: expect.stringContaining('spotify:track:123'),
                })
            );
        });

        it('should include position parameter', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 204,
            });

            await playTrack('spotify:track:123', 'device-id', mockToken, 30000);

            const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
            expect(callBody.position_ms).toBe(30000);
        });
    });
});

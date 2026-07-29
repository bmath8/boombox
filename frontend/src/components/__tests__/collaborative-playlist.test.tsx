/**
 * Collaborative Playlist Component Tests
 * Tests real-time playlist collaboration functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollaborativePlaylist } from '@/components/collaborative-playlist';
import { useWebSocket } from '@/lib/websocket';
import { supabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('@/lib/websocket', () => ({
    useWebSocket: jest.fn(() => ({
        lastMessage: null,
        sendMessage: jest.fn(),
        isConnected: true,
    })),
}));

jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            delete: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ error: null })),
            })),
        })),
    },
}));

jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    Reorder: {
        Group: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
        Item: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    },
}));

describe('CollaborativePlaylist Component', () => {
    const mockStationId = 'test-station-123';
    const mockQueue = [
        {
            queue_id: '1',
            station_id: mockStationId,
            user_id: 'user1',
            track_uri: 'spotify:track:1',
            track_name: 'Song 1',
            artist_name: 'Artist 1',
            album_art_url: 'https://example.com/art1.jpg',
            duration_ms: 180000,
            status: 'pending' as const,
            position: 0,
        },
        {
            queue_id: '2',
            station_id: mockStationId,
            user_id: 'user2',
            track_uri: 'spotify:track:2',
            track_name: 'Song 2',
            artist_name: 'Artist 2',
            album_art_url: 'https://example.com/art2.jpg',
            duration_ms: 200000,
            status: 'pending' as const,
            position: 1,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render playlist with initial queue', () => {
            render(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={false}
                />
            );

            expect(screen.getByText('Song 1')).toBeInTheDocument();
            expect(screen.getByText('Song 2')).toBeInTheDocument();
        });

        it('should display track information', () => {
            render(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={false}
                />
            );

            expect(screen.getByText('Artist 1')).toBeInTheDocument();
            expect(screen.getByText('Artist 2')).toBeInTheDocument();
        });

        it('should render empty state when queue is empty', () => {
            render(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={[]}
                    isBroadcaster={false}
                />
            );

            expect(screen.getByText(/playlist is empty/i)).toBeInTheDocument();
        });
    });

    describe('Broadcaster Controls', () => {
        it('should show remove button for broadcasters', () => {
            render(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={true}
                />
            );

            const removeButtons = screen.getAllByRole('button', { name: /remove/i });
            expect(removeButtons.length).toBeGreaterThan(0);
        });

        it('should hide remove button for non-broadcasters', () => {
            render(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={false}
                />
            );

            const removeButtons = screen.queryAllByRole('button', { name: /remove/i });
            expect(removeButtons.length).toBe(0);
        });

        it('should remove track when broadcaster clicks remove', async () => {
            const mockDelete = jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ error: null })),
            }));

            (supabase.from as jest.Mock).mockReturnValue({
                delete: mockDelete,
            });

            render(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={true}
                />
            );

            const removeButtons = screen.getAllByRole('button', { name: /remove/i });
            if (removeButtons[0]) {
                fireEvent.click(removeButtons[0]);
            }

            await waitFor(() => {
                expect(mockDelete).toHaveBeenCalled();
            });
        });
    });

    describe('Real-time Updates', () => {
        it('should add new track from WebSocket message', async () => {
            const newTrack = {
                queue_id: '3',
                track_id: 'track3',
                track_name: 'New Song',
                artist_name: 'New Artist',
                album_art_url: 'https://example.com/art3.jpg',
                votes: 0,
                position: 2,
                added_by: 'user3',
                added_at: new Date().toISOString(),
            };

            const mockMessage = {
                type: 'playlist:update',
                stationId: mockStationId,
                action: 'add',
                track: newTrack,
            };

            const { rerender } = render(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={false}
                />
            );

            // Simulate WebSocket message
            (useWebSocket as jest.Mock).mockReturnValue({
                lastMessage: mockMessage,
                sendMessage: jest.fn(),
                isConnected: true,
            });

            rerender(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={false}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('New Song')).toBeInTheDocument();
            });
        });

        it('should remove track from WebSocket message', async () => {
            const mockMessage = {
                type: 'playlist:update',
                stationId: mockStationId,
                action: 'remove',
                queueId: '1',
            };

            const { rerender } = render(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={false}
                />
            );

            expect(screen.getByText('Song 1')).toBeInTheDocument();

            // Simulate WebSocket message
            (useWebSocket as jest.Mock).mockReturnValue({
                lastMessage: mockMessage,
                sendMessage: jest.fn(),
                isConnected: true,
            });

            rerender(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={false}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Song 1')).not.toBeInTheDocument();
            });
        });

        it('should ignore updates from other stations', async () => {
            const mockMessage = {
                type: 'playlist:update',
                stationId: 'different-station',
                action: 'add',
                track: {
                    queue_id: '99',
                    track_name: 'Should Not Appear',
                },
            };

            (useWebSocket as jest.Mock).mockReturnValue({
                lastMessage: mockMessage,
                sendMessage: jest.fn(),
                isConnected: true,
            });

            render(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={false}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('Should Not Appear')).not.toBeInTheDocument();
            });
        });

        it('should prevent duplicate tracks', async () => {
            const duplicateTrack = { ...mockQueue[0] };

            const mockMessage = {
                type: 'playlist:update',
                stationId: mockStationId,
                action: 'add',
                track: duplicateTrack,
            };

            const { rerender } = render(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={false}
                />
            );

            // Simulate WebSocket message
            (useWebSocket as jest.Mock).mockReturnValue({
                lastMessage: mockMessage,
                sendMessage: jest.fn(),
                isConnected: true,
            });

            rerender(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={false}
                />
            );

            // Should still only have 2 tracks, not 3
            const song1Elements = screen.getAllByText('Song 1');
            expect(song1Elements.length).toBe(1);
        });
    });

    describe('Queue Management', () => {
        it('should update queue when initialQueue prop changes', () => {
            const { rerender } = render(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={mockQueue}
                    isBroadcaster={false}
                />
            );

            expect(screen.getByText('Song 1')).toBeInTheDocument();

            const newQueue = [
                {
                    queue_id: '1',
                    station_id: mockStationId,
                    user_id: 'user1',
                    track_uri: 'spotify:track:1',
                    track_name: 'Updated Song',
                    artist_name: 'Artist 1',
                    album_art_url: 'https://example.com/art1.jpg',
                    duration_ms: 180000,
                    status: 'pending' as const,
                    position: 0,
                },
            ];

            rerender(
                <CollaborativePlaylist
                    stationId={mockStationId}
                    initialQueue={newQueue}
                    isBroadcaster={false}
                />
            );

            expect(screen.getByText('Updated Song')).toBeInTheDocument();
            expect(screen.queryByText('Song 2')).not.toBeInTheDocument();
        });
    });
});

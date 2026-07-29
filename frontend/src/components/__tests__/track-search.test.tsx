/**
 * TrackSearch Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrackSearch } from '@/components/track-search';

// Mock fetch
global.fetch = jest.fn();

// Mock rate limiter
jest.mock('@/lib/rate-limit', () => ({
    withRateLimit: jest.fn((key, config, fn) => fn()),
    RATE_LIMITS: {
        SUPABASE_QUERY: { maxRequests: 100, windowMs: 60000 },
    },
}));

describe('TrackSearch Component', () => {
    const mockOnTrackSelect = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render search input', () => {
        render(<TrackSearch onTrackSelect={mockOnTrackSelect} />);

        const input = screen.getByPlaceholderText(/search for tracks/i);
        expect(input).toBeInTheDocument();
    });

    it('should render custom placeholder', () => {
        render(
            <TrackSearch
                onTrackSelect={mockOnTrackSelect}
                placeholder="Find music..."
            />
        );

        expect(screen.getByPlaceholderText('Find music...')).toBeInTheDocument();
    });

    it('should search when form is submitted', async () => {
        const mockTracks = [
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
                preview_url: null,
            },
        ];

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ tracks: mockTracks }),
        });

        render(<TrackSearch onTrackSelect={mockOnTrackSelect} />);

        const input = screen.getByPlaceholderText(/search for tracks/i);
        fireEvent.change(input, { target: { value: 'test query' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('Test Track')).toBeInTheDocument();
        });
    });

    it('should display loading state', async () => {
        (global.fetch as jest.Mock).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve({
                ok: true,
                json: async () => ({ tracks: [] }),
            }), 100))
        );

        render(<TrackSearch onTrackSelect={mockOnTrackSelect} />);

        const input = screen.getByPlaceholderText(/search for tracks/i);
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.submit(input.closest('form')!);

        expect(screen.getByText(/searching/i)).toBeInTheDocument();
    });

    it('should call onTrackSelect when track is clicked', async () => {
        const mockTrack = {
            id: 'track-1',
            name: 'Test Track',
            artists: [{ name: 'Test Artist', id: 'artist-1' }],
            album: {
                name: 'Test Album',
                images: [{ url: 'https://example.com/image.jpg', height: 640, width: 640 }],
            },
            duration_ms: 180000,
            uri: 'spotify:track:track-1',
            preview_url: null,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ tracks: [mockTrack] }),
        });

        render(<TrackSearch onTrackSelect={mockOnTrackSelect} />);

        const input = screen.getByPlaceholderText(/search for tracks/i);
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('Test Track')).toBeInTheDocument();
        });

        const addButton = screen.getByLabelText('Add track');
        fireEvent.click(addButton);

        expect(mockOnTrackSelect).toHaveBeenCalledWith(mockTrack);
    });

    it('should display no results message', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ tracks: [] }),
        });

        render(<TrackSearch onTrackSelect={mockOnTrackSelect} />);

        const input = screen.getByPlaceholderText(/search for tracks/i);
        fireEvent.change(input, { target: { value: 'nonexistent' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => {
            expect(screen.getByText(/no tracks found/i)).toBeInTheDocument();
        });
    });

    it('should handle search errors gracefully', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            statusText: 'Unauthorized',
        });

        render(<TrackSearch onTrackSelect={mockOnTrackSelect} />);

        const input = screen.getByPlaceholderText(/search for tracks/i);
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => {
            expect(screen.queryByText('Test Track')).not.toBeInTheDocument();
        });
    });

    it('should format track duration correctly', async () => {
        const mockTrack = {
            id: 'track-1',
            name: 'Test Track',
            artists: [{ name: 'Artist', id: 'artist-1' }],
            album: { name: 'Album', images: [] },
            duration_ms: 185000, // 3:05
            uri: 'spotify:track:track-1',
            preview_url: null,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ tracks: [mockTrack] }),
        });

        render(<TrackSearch onTrackSelect={mockOnTrackSelect} />);

        const input = screen.getByPlaceholderText(/search for tracks/i);
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('3:05')).toBeInTheDocument();
        });
    });
});

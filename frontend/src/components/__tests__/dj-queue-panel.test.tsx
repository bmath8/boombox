/**
 * DJ Queue Panel Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DJQueuePanel } from '@/components/dj-queue-panel';
import { supabase } from '@/lib/supabase';

// Mock dnd-kit
jest.mock('@dnd-kit/core', () => ({
    DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useSensor: jest.fn(),
    useSensors: jest.fn(),
    PointerSensor: jest.fn(),
    KeyboardSensor: jest.fn(),
    closestCenter: jest.fn(),
}));

jest.mock('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: jest.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
    verticalListSortingStrategy: jest.fn(),
    arrayMove: jest.fn(),
    sortableKeyboardCoordinates: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        channel: jest.fn(() => ({
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockReturnThis(),
            unsubscribe: jest.fn(),
        })),
    },
}));

describe('DJQueuePanel', () => {
    const mockQueue = [
        {
            queue_id: '1',
            station_id: 'station-1',
            user_id: 'user-1',
            track_uri: 'spotify:track:1',
            track_name: 'Track 1',
            artist_name: 'Artist 1',
            position: 0,
            status: 'pending',
            user: { display_name: 'User 1' },
        },
        {
            queue_id: '2',
            station_id: 'station-1',
            user_id: 'user-2',
            track_uri: 'spotify:track:2',
            track_name: 'Track 2',
            artist_name: 'Artist 2',
            position: 1,
            status: 'pending',
            user: { display_name: 'User 2' },
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockQueue, error: null }),
        });
    });

    it('should render queue items', async () => {
        render(
            <DJQueuePanel
                stationId="station-1"
                currentUserId="user-1"
                isBroadcaster={false}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Track 1')).toBeInTheDocument();
            expect(screen.getByText('Track 2')).toBeInTheDocument();
        });
    });

    it('should show settings button for broadcaster', async () => {
        render(
            <DJQueuePanel
                stationId="station-1"
                currentUserId="broadcaster"
                isBroadcaster={true}
            />
        );

        await waitFor(() => {
            expect(screen.getByLabelText('Queue Settings')).toBeInTheDocument();
        });
    });

    it('should not show settings button for listener', async () => {
        render(
            <DJQueuePanel
                stationId="station-1"
                currentUserId="user-1"
                isBroadcaster={false}
            />
        );

        await waitFor(() => {
            expect(screen.queryByLabelText('Queue Settings')).not.toBeInTheDocument();
        });
    });

    it('should show join queue button for listener not in queue', async () => {
        // Mock empty queue
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
        });

        render(
            <DJQueuePanel
                stationId="station-1"
                currentUserId="new-user"
                isBroadcaster={false}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Join Queue')).toBeInTheDocument();
        });
    });
});

/**
 * Station Chat Component Tests
 * Tests real-time chat functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StationChat } from '@/components/station-chat';
import { supabase } from '@/lib/supabase';
import { useWebSocket } from '@/lib/websocket';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    order: jest.fn(() => ({
                        limit: jest.fn(() => ({
                            data: [],
                            error: null,
                        })),
                    })),
                })),
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => ({
                        data: null,
                        error: null,
                    })),
                })),
            })),
        })),
        channel: jest.fn(() => ({
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockReturnValue({
                unsubscribe: jest.fn(),
            }),
        })),
        auth: {
            getUser: jest.fn(() => ({
                data: { user: { id: 'test-user-id' } },
                error: null,
            })),
        },
    },
}));

jest.mock('@/lib/websocket', () => ({
    useWebSocket: jest.fn(() => ({
        lastMessage: null,
        sendMessage: jest.fn(),
        isConnected: true,
    })),
}));

// Mock cachedFetch
jest.mock('@/lib/cache', () => ({
    cachedFetch: jest.fn((key, fetcher) => fetcher()),
    cacheKey: jest.fn((...args) => args.join(':')),
}));

jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/lib/error-handler', () => ({
    handleError: jest.fn(),
}));

describe('StationChat Component', () => {
    const mockStationId = 'test-station-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render chat container', async () => {
            render(<StationChat stationId={mockStationId} />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
            });
        });

        it('should render send button', async () => {
            render(<StationChat stationId={mockStationId} />);

            await waitFor(() => {
                const sendButton = screen.getByRole('button', { name: /send/i });
                expect(sendButton).toBeInTheDocument();
            });
        });

        it('should show loading state initially', () => {
            render(<StationChat stationId={mockStationId} />);

            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });
    });

    describe('Message Input', () => {
        it('should accept text input', async () => {
            render(<StationChat stationId={mockStationId} />);

            await waitFor(() => {
                const input = screen.getByPlaceholderText(/type a message/i);
                fireEvent.change(input, { target: { value: 'Hello world' } });
                expect(input).toHaveValue('Hello world');
            });
        });

        it('should clear input after sending', async () => {
            const mockSendMessage = jest.fn();
            (useWebSocket as jest.Mock).mockReturnValue({
                lastMessage: null,
                sendMessage: mockSendMessage,
                isConnected: true,
            });

            render(<StationChat stationId={mockStationId} />);

            await waitFor(() => {
                const input = screen.getByPlaceholderText(/type a message/i);
                const sendButton = screen.getByRole('button', { name: /send/i });

                fireEvent.change(input, { target: { value: 'Test message' } });
                fireEvent.click(sendButton);

                expect(input).toHaveValue('');
            });
        });

        it('should not send empty messages', async () => {
            const mockSendMessage = jest.fn();
            (useWebSocket as jest.Mock).mockReturnValue({
                lastMessage: null,
                sendMessage: mockSendMessage,
                isConnected: true,
            });

            render(<StationChat stationId={mockStationId} />);

            await waitFor(() => {
                const sendButton = screen.getByRole('button', { name: /send/i });
                fireEvent.click(sendButton);

                expect(mockSendMessage).not.toHaveBeenCalled();
            });
        });
    });

    describe('Message Display', () => {
        it('should display messages from database', async () => {
            const mockMessages = [
                {
                    message_id: '1',
                    station_id: mockStationId,
                    user_id: 'user1',
                    content: 'Hello!',
                    created_at: new Date().toISOString(),
                    users: { display_name: 'User 1' },
                },
            ];

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        order: jest.fn(() => ({
                            limit: jest.fn(() => Promise.resolve({
                                data: mockMessages,
                                error: null,
                            })),
                        })),
                    })),
                })),
            });

            render(<StationChat stationId={mockStationId} />);

            await waitFor(() => {
                expect(screen.getByText('Hello!')).toBeInTheDocument();
            });
        });

        it('should handle message fetch errors', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        order: jest.fn(() => ({
                            limit: jest.fn(() => Promise.resolve({
                                data: null,
                                error: { message: 'Database error' },
                            })),
                        })),
                    })),
                })),
            });

            render(<StationChat stationId={mockStationId} />);

            await waitFor(() => {
                // Component should handle error gracefully
                expect(screen.queryByText(/database error/i)).not.toBeInTheDocument();
            });
        });
    });

    describe('Real-time Updates', () => {
        it('should update when receiving new messages via WebSocket', async () => {
            // Ensure fetch succeeds
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                }),
            });

            const mockMessage = {
                type: 'chat:message',
                stationId: mockStationId,
                message: {
                    message_id: '2',
                    content: 'New message!',
                    user: { display_name: 'User 2' },
                },
            };

            const { rerender } = render(<StationChat stationId={mockStationId} />);

            // Wait for initial load to complete
            await waitFor(() => {
                expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });

            // Simulate WebSocket message
            (useWebSocket as jest.Mock).mockReturnValue({
                lastMessage: mockMessage,
                sendMessage: jest.fn(),
                isConnected: true,
            });

            rerender(<StationChat stationId={mockStationId} />);

            await waitFor(() => {
                expect(screen.getByText('New message!')).toBeInTheDocument();
            });
        });

        it('should ignore messages from other stations', async () => {
            const mockMessage = {
                type: 'chat:message',
                stationId: 'different-station',
                message: {
                    message_id: '3',
                    content: 'Other station message',
                },
            };

            (useWebSocket as jest.Mock).mockReturnValue({
                lastMessage: mockMessage,
                sendMessage: jest.fn(),
                isConnected: true,
            });

            render(<StationChat stationId={mockStationId} />);

            await waitFor(() => {
                expect(screen.queryByText('Other station message')).not.toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper input labels', async () => {
            render(<StationChat stationId={mockStationId} />);

            await waitFor(() => {
                const input = screen.getByPlaceholderText(/type a message/i);
                expect(input).toBeInTheDocument();
            });
        });

        it('should have accessible send button', async () => {
            render(<StationChat stationId={mockStationId} />);

            await waitFor(() => {
                const button = screen.getByRole('button', { name: /send/i });
                expect(button).toBeInTheDocument();
            });
        });
    });
});

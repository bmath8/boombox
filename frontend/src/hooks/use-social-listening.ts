'use client';

import { useState, useCallback, useEffect } from 'react';

interface User {
    id: string;
    name: string;
    avatar?: string;
    isDj: boolean;
}

interface Room {
    id: string;
    name: string;
    currentTrack: any;
    listeners: User[];
    hostId: string;
}

/**
 * Hook for Social Listening Rooms
 * 
 * Manages real-time room state, participant lists, and sync
 */
export function useSocialListening() {
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [messages, setMessages] = useState<any[]>([]);

    const createRoom = useCallback((name: string) => {
        // Mock room creation
        const newRoom: Room = {
            id: `room-${Date.now()}`,
            name,
            currentTrack: null,
            listeners: [],
            hostId: 'current-user',
        };
        setCurrentRoom(newRoom);
        console.log('[Social] Room created:', name);
    }, []);

    const joinRoom = useCallback((roomId: string) => {
        // Mock join
        console.log('[Social] Joining room:', roomId);
        // Simulate room data fetch
        setTimeout(() => {
            setCurrentRoom({
                id: roomId,
                name: 'Chill Lounge',
                currentTrack: { name: 'Sunset', artist: 'The Midnight' },
                listeners: [
                    { id: '1', name: 'Host', isDj: true },
                    { id: '2', name: 'Guest', isDj: false },
                ],
                hostId: '1',
            });
        }, 500);
    }, []);

    const leaveRoom = useCallback(() => {
        setCurrentRoom(null);
        setMessages([]);
    }, []);

    const sendMessage = useCallback((text: string) => {
        if (!currentRoom) return;
        const msg = {
            id: Date.now(),
            text,
            sender: 'Me',
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, msg]);
    }, [currentRoom]);

    return {
        currentRoom,
        messages,
        createRoom,
        joinRoom,
        leaveRoom,
        sendMessage,
    };
}

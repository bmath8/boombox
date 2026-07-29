'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { logger } from './logger';
import { env } from './env';
import type { ServerMessage, ClientMessage } from '@/types/websocket';

type WebSocketContextType = {
    socket: WebSocket | null;
    isConnected: boolean;
    lastMessage: ServerMessage | null;
    sendMessage: (message: ClientMessage) => void;
};


const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const wsRef = useRef<WebSocket | null>(null);
    const retryCountRef = useRef(0);
    const maxRetriesRef = useRef(10); // Max 10 retries before giving up
    const intentionalCloseRef = useRef(false);

    // Prevent hydration errors by only initializing WebSocket on client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined' || !isMounted) return;

        const connect = async () => {
            // Get current session for authentication
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                return;
            }

            // If token is expired or undefined, don't try URL
            if (!session.access_token || session.access_token === 'undefined') {
                logger.warn('WS: Invalid token, aborting connect');
                return;
            }

            // FORCE REFRESH if token is stale (or close to it)
            // This ensures we don't hammer the WS with a dying token
            const expiresAt = session.expires_at || 0;
            const now = Math.floor(Date.now() / 1000);
            if (expiresAt - now < 300) { // If < 5 mins left
                logger.info('WS: Token close to expiry, refreshing before connect...');
                const { data, error } = await supabase.auth.refreshSession();
                if (error || !data.session) {
                    logger.error('WS: Failed to refresh token, forcing signout');
                    await supabase.auth.signOut();
                    window.location.reload(); // Force reload to clear state
                    return;
                }
                // Update token with new one
                session.access_token = data.session.access_token;
            }

            // Use validated WebSocket URL (optional)
            const wsUrl = env.NEXT_PUBLIC_WS_URL;

            // Skip WebSocket if not configured
            if (!wsUrl) {
                logger.info('WS: WebSocket URL not configured, skipping connection');
                return;
            }

            // We'll use the Supabase JWT as the token for our custom WS server
            const token = session.access_token;

            const ws = new WebSocket(`${wsUrl}?token=${token}`);

            wsRef.current = ws;

            logger.info('WS: Attempting connection to', { url: wsUrl, tokenPresent: !!token });

            ws.onopen = () => {
                logger.info('✅ WebSocket Connected');
                setIsConnected(true);
                setSocket(ws);
                retryCountRef.current = 0; // Reset retry count on success
            };

            ws.onclose = (event) => {
                // Only log if this is an actual disconnect (not initial failure to connect)
                if (retryCountRef.current > 0 || event.code !== 1006) {
                    logger.info('❌ WebSocket Disconnected', { code: event.code, reason: event.reason });
                }
                setIsConnected(false);
                setSocket(null);

                // Don't reconnect if closed intentionally or by auth
                if (intentionalCloseRef.current || event.code === 1000) {
                    logger.info('Connection closed intentionally, not reconnecting');
                    return;
                }

                // Code 1006 = abnormal closure (server unreachable) - be less aggressive
                if (event.code === 1006 && retryCountRef.current >= 3) {
                    // After 3 failed attempts to unreachable server, slow down significantly
                    const slowBackoff = 60000; // 1 minute between retries when server is down
                    retryCountRef.current += 1;

                    if (retryCountRef.current <= maxRetriesRef.current) {
                        logger.info(`🔄 WS server unreachable. Retrying in ${slowBackoff / 1000}s (Attempt ${retryCountRef.current}/${maxRetriesRef.current})`);
                        reconnectTimeoutRef.current = setTimeout(() => {
                            connect();
                        }, slowBackoff);
                    } else {
                        logger.warn(`Max reconnection attempts reached. Will retry when tab becomes visible.`);
                    }
                    return;
                }

                // Check max retries for normal disconnects
                if (retryCountRef.current >= maxRetriesRef.current) {
                    logger.warn(`Max reconnection attempts (${maxRetriesRef.current}) reached. Will retry when tab becomes visible.`);
                    return;
                }

                // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
                const backoff = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                retryCountRef.current += 1;

                logger.info(`🔄 Reconnecting in ${backoff}ms (Attempt ${retryCountRef.current}/${maxRetriesRef.current})`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, backoff);
            };


            ws.onerror = (event: Event) => {
                // DOM Error Events are not Error objects and often stringify to {}
                // Only log actual errors, not connection failures when server is down
                const ws = event.target as WebSocket;

                // If this is a first connection attempt and server is unreachable, don't spam errors
                if (retryCountRef.current === 0 && ws.readyState === WebSocket.CLOSED) {
                    // Silent fail - will be handled by onclose
                    return;
                }

                const errorDetails = {
                    type: event.type,
                    timeStamp: event.timeStamp,
                    code: (event as any).code,
                    reason: (event as any).reason,
                    targetUrl: ws?.url
                };

                // Only log if it's a meaningful error (not just server unreachable)
                if (event.type === 'error' && retryCountRef.current > 0) {
                    logger.warn('WebSocket Connection Error', errorDetails);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle server ping (respond with pong)
                    if (data.type === 'ping') {
                        ws.send(JSON.stringify({ type: 'pong' }));
                        return;
                    }

                    setLastMessage(data);
                } catch (err) {
                    logger.error('Failed to parse WebSocket message', err);
                }
            };
        };

        connect();

        // Visibility change listener - reconnect when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !wsRef.current) {
                logger.info('Tab became visible, attempting WebSocket reconnection...');
                retryCountRef.current = 0; // Reset retry count
                connect();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Listen for auth state changes to reconnect/disconnect
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' && !wsRef.current) {
                intentionalCloseRef.current = false;
                connect();
            } else if (event === 'SIGNED_OUT') {
                intentionalCloseRef.current = true;
                wsRef.current?.close();
                wsRef.current = null;
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
            }
        });

        return () => {
            intentionalCloseRef.current = true;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            wsRef.current?.close();
            subscription.unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isMounted]);

    const sendMessage = (message: ClientMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            logger.warn('WebSocket not connected, cannot send message:', message.type);
        }
    };


    return (
        <WebSocketContext.Provider value={{ socket, isConnected, lastMessage, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}

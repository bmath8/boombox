'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './websocket';
import { useSpotify } from './spotify-sdk';
import { supabase } from './supabase';
import RadioSyncEngine from './RadioSyncEngine';

import { Station } from './types';
import { handleError } from './error-handler';

type RadioContextType = {
    currentStation: Station | null;
    isBroadcasting: boolean;
    isListening: boolean;
    startBroadcasting: (name: string) => Promise<Station | undefined>;
    stopBroadcasting: () => Promise<void>;
    joinStation: (stationId: string) => Promise<void>;
    leaveStation: () => Promise<void>;
    syncEngine: RadioSyncEngine | null;
};

const RadioContext = createContext<RadioContextType | null>(null);

export function RadioProvider({ children }: { children: React.ReactNode }) {
    const { lastMessage, sendMessage } = useWebSocket();
    const { player } = useSpotify();
    const [currentStation, setCurrentStation] = useState<Station | null>(null);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [syncEngine, setSyncEngine] = useState<RadioSyncEngine | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle incoming radio messages
    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.type === 'radio:track-change' && isListening && syncEngine) {
            syncEngine.handleTrackChange(lastMessage);
        }

        if (lastMessage.type === 'radio:position-update' && isListening && syncEngine && currentStation?.current_track_id) {
            syncEngine.handlePositionUpdate({
                trackId: currentStation.current_track_id,
                positionMs: lastMessage.positionMs,
                timestamp: lastMessage.timestamp,
            });
        }
    }, [lastMessage, isListening, syncEngine]);

    const startBroadcasting = useCallback(async (name: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Create station in DB
        const { data: station, error } = await supabase
            .from('radio_stations')
            .insert({
                station_name: name,
                broadcaster_id: user.id,
                status: 'live',
                went_live_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('[StartBroadcasting] Error MSG:', error.message);
            console.error('[StartBroadcasting] Error CODE:', error.code);
            handleError(error, 'StartBroadcasting');
            return;
        }

        setCurrentStation(station);
        setIsBroadcasting(true);

        // Notify server
        sendMessage({
            type: 'radio:join',
            stationId: station.station_id,
            timestamp: Date.now(),
        });

        return station;
    }, [sendMessage]);

    const stopBroadcasting = useCallback(async () => {
        if (!currentStation) return;

        await supabase
            .from('radio_stations')
            .update({ status: 'offline', ended_at: new Date().toISOString() })
            .eq('station_id', currentStation.station_id);

        setCurrentStation(null);
        setIsBroadcasting(false);
        if (currentStation) {
            sendMessage({
                type: 'radio:leave',
                stationId: currentStation.station_id,
                timestamp: Date.now(),
            });
        }
    }, [currentStation, sendMessage]);

    const joinStation = useCallback(async (stationId: string) => {
        // Fetch station details
        const { data: station, error } = await supabase
            .from('radio_stations')
            .select('*')
            .eq('station_id', stationId)
            .single();

        if (error) {
            console.error('[JoinStation] Supabase Error MSG:', error.message);
            console.error('[JoinStation] Supabase Error CODE:', error.code || 'UNKNOWN');
            console.error('[JoinStation] Details:', JSON.stringify(error, null, 2));
            handleError(new Error(error.message || 'Failed to join station'), 'JoinStation');
            return;
        }

        setCurrentStation(station);
        setIsListening(true);

        // Initialize sync engine
        if (player) {
            const engine = new RadioSyncEngine(stationId, player);
            setSyncEngine(engine);
        }

        // Notify server
        sendMessage({
            type: 'radio:join',
            stationId: stationId,
            timestamp: Date.now(),
        });
    }, [player, sendMessage]);

    const leaveStation = useCallback(async () => {
        if (!currentStation) return;

        sendMessage({
            type: 'radio:leave',
            stationId: currentStation.station_id,
            timestamp: Date.now(),
        });

        setCurrentStation(null);
        setIsListening(false);
        setSyncEngine(null);
    }, [currentStation, sendMessage]);

    return (
        <RadioContext.Provider
            value={{
                currentStation,
                isBroadcasting,
                isListening,
                startBroadcasting,
                stopBroadcasting,
                joinStation,
                leaveStation,
                syncEngine,
            }}
        >
            {children}
        </RadioContext.Provider>
    );
}

export function useRadio() {
    const context = useContext(RadioContext);
    if (!context) {
        throw new Error('useRadio must be used within a RadioProvider');
    }
    return context;
}

import { useEffect, useCallback } from 'react';
import { useRadioStore } from '@/stores/radio-store';
import { useWebSocket } from '@/lib/websocket';
import { useSpotify } from '@/lib/spotify-sdk';
import { supabase } from '@/lib/supabase';
import RadioSyncEngine from '@/lib/RadioSyncEngine';
import { handleError } from '@/lib/error-handler';
import type { Station } from '@/lib/types';

/**
 * useRadio Hook
 *
 * Replaces the RadioContext with Zustand-based state management.
 * Provides all radio functionality: broadcasting, listening, station management.
 *
 * Usage:
 * const { currentStation, startBroadcasting, joinStation } = useRadio();
 */
export function useRadio() {
    const { lastMessage, sendMessage } = useWebSocket();
    const { player } = useSpotify();

    const {
        currentStation,
        isBroadcasting,
        isListening,
        syncEngine,
        setCurrentStation,
        setIsBroadcasting,
        setIsListening,
        setSyncEngine,
    } = useRadioStore();

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

    const startBroadcasting = useCallback(async (name: string): Promise<Station | undefined> => {
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
    }, [sendMessage, setCurrentStation, setIsBroadcasting]);

    const stopBroadcasting = useCallback(async () => {
        if (!currentStation) return;

        await supabase
            .from('radio_stations')
            .update({ status: 'offline', ended_at: new Date().toISOString() })
            .eq('station_id', currentStation.station_id);

        sendMessage({
            type: 'radio:leave',
            stationId: currentStation.station_id,
            timestamp: Date.now(),
        });

        setCurrentStation(null);
        setIsBroadcasting(false);
    }, [currentStation, sendMessage, setCurrentStation, setIsBroadcasting]);

    const joinStation = useCallback(async (stationId: string) => {
        // Fetch station details
        const { data: station, error } = await supabase
            .from('radio_stations')
            .select('*')
            .eq('station_id', stationId)
            .single();

        if (error || !station) {
            handleError(error || new Error('Station not found'), 'JoinStation');
            return;
        }

        setCurrentStation(station);
        setIsListening(true);

        // Initialize sync engine
        if (player) {
            const engine = new RadioSyncEngine(station.station_id, player);
            setSyncEngine(engine);
        }

        // Join via WebSocket
        sendMessage({
            type: 'radio:join',
            stationId: station.station_id,
            timestamp: Date.now(),
        });
    }, [player, sendMessage, setCurrentStation, setIsListening, setSyncEngine]);

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
    }, [currentStation, sendMessage, setCurrentStation, setIsListening, setSyncEngine]);

    return {
        currentStation,
        isBroadcasting,
        isListening,
        syncEngine,
        startBroadcasting,
        stopBroadcasting,
        joinStation,
        leaveStation,
    };
}

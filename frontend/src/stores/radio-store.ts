import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Station } from '@/lib/types';
import RadioSyncEngine from '@/lib/RadioSyncEngine';

/**
 * Radio Store - Zustand
 *
 * Manages radio station state, broadcasting, and listening.
 * Replaces the RadioContext with better performance and dev tools.
 */

interface RadioState {
    // State
    currentStation: Station | null;
    isBroadcasting: boolean;
    isListening: boolean;
    syncEngine: RadioSyncEngine | null;

    // Actions
    setCurrentStation: (station: Station | null) => void;
    setIsBroadcasting: (broadcasting: boolean) => void;
    setIsListening: (listening: boolean) => void;
    setSyncEngine: (engine: RadioSyncEngine | null) => void;

    // Complex actions (will be populated by hooks)
    startBroadcasting: ((name: string) => Promise<Station | undefined>) | null;
    stopBroadcasting: (() => Promise<void>) | null;
    joinStation: ((stationId: string) => Promise<void>) | null;
    leaveStation: (() => Promise<void>) | null;

    // Helper actions
    reset: () => void;
}

export const useRadioStore = create<RadioState>()(
    devtools(
        persist(
            (set) => ({
                // Initial state
                currentStation: null,
                isBroadcasting: false,
                isListening: false,
                syncEngine: null,

                // Action implementations
                startBroadcasting: null,
                stopBroadcasting: null,
                joinStation: null,
                leaveStation: null,

                // Simple setters
                setCurrentStation: (station) => set({ currentStation: station }),
                setIsBroadcasting: (broadcasting) => set({ isBroadcasting: broadcasting }),
                setIsListening: (listening) => set({ isListening: listening }),
                setSyncEngine: (engine) => set({ syncEngine: engine }),

                // Reset
                reset: () => set({
                    currentStation: null,
                    isBroadcasting: false,
                    isListening: false,
                    syncEngine: null,
                }),
            }),
            {
                name: 'radio-storage',
                // Only persist certain fields
                partialize: (state) => ({
                    currentStation: state.currentStation,
                    isBroadcasting: state.isBroadcasting,
                    isListening: state.isListening,
                }),
            }
        ),
        { name: 'RadioStore' }
    )
);

/**
 * Selectors for optimized re-renders
 * Use these to subscribe to specific parts of state
 */
export const useCurrentStation = () => useRadioStore((state) => state.currentStation);
export const useIsBroadcasting = () => useRadioStore((state) => state.isBroadcasting);
export const useIsListening = () => useRadioStore((state) => state.isListening);
export const useSyncEngine = () => useRadioStore((state) => state.syncEngine);

'use client';

import { useState, useEffect } from 'react';
import { useSpotify } from '@/lib/spotify-sdk';
import { useRadio } from '@/lib/radio-station';
import { Play, Pause, SkipForward, Shuffle, Repeat, LayoutGrid, MessageCircle, ListMusic, Radio, Mic, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedStationChat } from '@/components/enhanced-station-chat';
import { DJQueuePanel } from '@/components/dj-queue-panel';
import { VoiceChat } from '@/components/voice-chat';
import { StationDiscoveryFeed } from '@/components/station-discovery-feed';
import { isMockStation } from '@/lib/constants';

interface DarkModePlayerProps {
    stationId: string;
    onToggleView?: () => void;
}

export function DarkModePlayer({ stationId, onToggleView }: DarkModePlayerProps) {
    const { currentTrack, isPaused } = useSpotify();
    const { currentStation, joinStation, leaveStation } = useRadio();
    const [activeTab, setActiveTab] = useState<'chat' | 'queue' | 'stations' | 'voice' | null>(null);
    const [currentUserId] = useState<string | null>('user-123');

    const displayStation = currentStation || (['test-station', 'lobby'].includes(stationId) ? {
        station_id: stationId,
        station_name: stationId === 'lobby' ? 'BOOMBOX Radio' : 'Neon Nights FM',
        broadcaster_id: 'user-123',
        status: 'live',
        listener_count: stationId === 'lobby' ? 256 : 128,
        current_track: null
    } : null);

    useEffect(() => {
        if (stationId && !isMockStation(stationId)) {
            joinStation(stationId);
        }
        return () => {
            if (currentStation?.station_id === stationId && !isMockStation(stationId)) {
                void leaveStation();
            }
        };
    }, [stationId, joinStation, leaveStation, currentStation]);

    const tabButtons = [
        { id: 'stations' as const, icon: Radio, label: 'Stations' },
        { id: 'chat' as const, icon: MessageCircle, label: 'Chat' },
        { id: 'queue' as const, icon: ListMusic, label: 'Queue' },
        { id: 'voice' as const, icon: Mic, label: 'Voice' },
    ];

    return (
        <div
            className="h-screen w-full relative overflow-hidden"
            style={{
                background: `linear-gradient(145deg, #1e2433 0%, #171b27 40%, #11141c 100%)`
            }}
        >
            {/* Feature Buttons */}
            <div className="absolute top-4 left-4 z-50 flex gap-2">
                {tabButtons.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                        className={cn(
                            "px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                            activeTab === tab.id
                                ? "bg-cyan-500 text-black"
                                : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                        )}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {onToggleView && (
                <button
                    onClick={onToggleView}
                    className="absolute top-4 right-4 z-50 p-2.5 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                    <LayoutGrid className="w-5 h-5" />
                </button>
            )}

            {/* MAIN LAYOUT */}
            <div className="h-full w-full flex items-center px-8 lg:px-16">

                {/* LEFT: VINYL */}
                <div className="w-[45%] h-full flex items-center justify-center relative">

                    {/* GLOW BEHIND ENTIRE VINYL */}
                    <div
                        className="absolute rounded-full blur-[80px] opacity-60 pointer-events-none"
                        style={{
                            width: 'min(55vh, 500px)',
                            height: 'min(55vh, 500px)',
                            background: `conic-gradient(from 180deg, #00d4ff 0deg, #a855f7 120deg, #ec4899 240deg, #00d4ff 360deg)`
                        }}
                    />

                    {/* VINYL */}
                    <div
                        className={cn(
                            "relative rounded-full",
                            !isPaused && "vinyl-spin"
                        )}
                        style={{
                            width: 'min(50vh, 450px)',
                            height: 'min(50vh, 450px)',
                            minWidth: '250px',
                            minHeight: '250px',
                            background: `radial-gradient(circle at 35% 35%, #2a2a2a 0%, #151515 25%, #0a0a0a 100%)`,
                            boxShadow: `0 40px 80px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.9)`
                        }}
                    >
                        {/* Grooves */}
                        <div
                            className="absolute inset-[2%] rounded-full"
                            style={{
                                background: `repeating-radial-gradient(circle at center, transparent 0px, transparent 1px, rgba(255,255,255,0.01) 2px, transparent 3px, transparent 8px)`
                            }}
                        />

                        {/* Light Reflection */}
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: `conic-gradient(from 200deg, transparent 0deg, rgba(255,255,255,0.025) 15deg, transparent 30deg, transparent 180deg, rgba(255,255,255,0.015) 195deg, transparent 210deg)`
                            }}
                        />

                        {/* CENTER: ALBUM ART */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36%] h-[36%] rounded-full overflow-hidden"
                            style={{
                                background: `radial-gradient(circle at 40% 40%, #3d2a5c 0%, #251a3a 50%, #1a1228 100%)`,
                                boxShadow: `inset 0 0 40px rgba(0,0,0,0.8)`
                            }}
                        >
                            {currentTrack?.album?.images?.[0]?.url ? (
                                <Image
                                    src={currentTrack.album.images[0].url}
                                    alt="Album"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#3d2a5c] to-[#1a1228]" />
                            )}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/90 shadow-lg" />
                        </div>
                    </div>
                </div>

                {/* RIGHT: CONTROL PANEL - WIDE RECTANGLE */}
                <div className="w-[55%] h-full flex items-center justify-center">
                    <div
                        className="w-full rounded-[24px] py-10 px-12"
                        style={{
                            maxWidth: '650px',
                            background: `rgba(30, 36, 50, 0.45)`,
                            backdropFilter: `blur(30px)`,
                            border: `1px solid rgba(255,255,255,0.04)`,
                            boxShadow: `0 40px 80px rgba(0,0,0,0.4)`
                        }}
                    >
                        {/* TRACK INFO - CENTERED, BOLD, with minimal waveform behind */}
                        <div className="relative mb-10">
                            {/* MINIMAL WAVEFORM - Very thin bars, very subtle */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
                                <div className="flex items-center justify-center gap-[1px] h-[60px] w-full">
                                    {Array.from({ length: 80 }, (_, i) => {
                                        const center = 40;
                                        const distance = Math.abs(i - center);
                                        const baseHeight = Math.max(8, 55 - distance * 1.2);
                                        const variation = Math.sin(i * 0.6) * 6;
                                        const height = baseHeight + variation;

                                        // Gradient: cyan → purple → orange
                                        const progress = i / 79;
                                        let r, g, b;
                                        if (progress < 0.35) {
                                            r = 0; g = 180; b = 220;
                                        } else if (progress < 0.65) {
                                            const p = (progress - 0.35) / 0.3;
                                            r = Math.round(100 * p); g = Math.round(180 - 60 * p); b = Math.round(220 - 50 * p);
                                        } else {
                                            const p = (progress - 0.65) / 0.35;
                                            r = Math.round(100 + 155 * p); g = Math.round(120 - 50 * p); b = Math.round(170 - 120 * p);
                                        }

                                        return (
                                            <motion.div
                                                key={i}
                                                className="rounded-full"
                                                style={{
                                                    width: '2px',
                                                    backgroundColor: `rgb(${r}, ${g}, ${b})`
                                                }}
                                                animate={{ height: isPaused ? height * 0.3 : height }}
                                                transition={{ duration: 0.2, delay: i * 0.005 }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TRACK TEXT - CENTERED, VERY BOLD */}
                            <div className="relative z-10 text-center py-6">
                                <p className="text-white/40 text-sm mb-3 tracking-widest uppercase">Track Title</p>
                                <h2
                                    className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight"
                                    style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}
                                >
                                    {currentTrack?.name || 'Midnight Groove'}
                                </h2>
                                <p className="text-white/40 text-base tracking-wide">
                                    Artist: <span className="text-white font-bold text-lg">{currentTrack?.artists?.[0]?.name || 'The Soundscapes'}</span>
                                </p>
                            </div>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="relative mb-10">
                            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full w-1/2 rounded-full"
                                    style={{
                                        background: `linear-gradient(90deg, #00d4ff, #6366f1, #ec4899)`
                                    }}
                                />
                            </div>
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg"
                                style={{ left: 'calc(50% - 10px)', boxShadow: `0 0 15px rgba(0,212,255,0.5)` }}
                            />
                        </div>

                        {/* PLAYBACK CONTROLS */}
                        <div className="flex items-center justify-center gap-8 mb-8">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                                style={{
                                    background: `rgba(40, 50, 70, 0.9)`,
                                    borderColor: `rgba(0, 212, 255, 0.5)`
                                }}
                            >
                                <Play className="w-6 h-6 text-cyan-400 fill-cyan-400" />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                                style={{
                                    background: `rgba(40, 50, 70, 0.95)`,
                                    borderColor: `rgba(0, 212, 255, 0.7)`,
                                    boxShadow: `0 0 30px rgba(0, 212, 255, 0.2)`
                                }}
                            >
                                {isPaused ? (
                                    <Play className="w-8 h-8 text-cyan-400 fill-cyan-400 ml-1" />
                                ) : (
                                    <Pause className="w-8 h-8 text-cyan-400 fill-cyan-400" />
                                )}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                                style={{
                                    background: `rgba(40, 50, 70, 0.9)`,
                                    borderColor: `rgba(0, 212, 255, 0.5)`
                                }}
                            >
                                <SkipForward className="w-6 h-6 text-cyan-400 fill-cyan-400" />
                            </motion.button>
                        </div>

                        {/* SHUFFLE & REPEAT */}
                        <div className="flex items-center justify-center gap-12">
                            <motion.button whileHover={{ scale: 1.15 }} className="p-3">
                                <Shuffle className="w-6 h-6 text-cyan-400/70 hover:text-cyan-400" />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} className="p-3">
                                <Repeat className="w-6 h-6 text-pink-400/70 hover:text-pink-400" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <AnimatePresence>
                {activeTab && displayStation && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 22 }}
                        className="fixed top-0 right-0 h-full w-full md:w-96 z-[100]"
                        style={{
                            background: `rgba(18, 22, 32, 0.98)`,
                            backdropFilter: `blur(24px)`,
                            borderLeft: `1px solid rgba(255,255,255,0.08)`
                        }}
                    >
                        <div className="h-full flex flex-col p-6">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                                <h2 className="font-bold text-lg text-white uppercase tracking-wider">{activeTab}</h2>
                                <button onClick={() => setActiveTab(null)} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white">
                                    <LogOut className="w-4 h-4 rotate-180" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {activeTab === 'chat' && <EnhancedStationChat stationId={displayStation.station_id} isBroadcaster={displayStation.broadcaster_id === currentUserId} />}
                                {activeTab === 'queue' && <DJQueuePanel stationId={displayStation.station_id} currentUserId={currentUserId} isBroadcaster={displayStation.broadcaster_id === currentUserId} />}
                                {activeTab === 'voice' && <VoiceChat stationId={displayStation.station_id} isBroadcaster={displayStation.broadcaster_id === currentUserId} />}
                                {activeTab === 'stations' && <StationDiscoveryFeed />}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

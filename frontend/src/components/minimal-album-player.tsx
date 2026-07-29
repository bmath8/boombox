'use client';

import { useState, useEffect, useRef } from 'react';
import { useSpotify } from '@/lib/spotify-sdk';
import { useRadio } from '@/lib/radio-station';
import { Play, Pause, SkipBack, SkipForward, Menu, X, MessageCircle, ListMusic, Radio, Mic, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedStationChat } from '@/components/enhanced-station-chat';
import { DJQueuePanel } from '@/components/dj-queue-panel';
import { VoiceChat } from '@/components/voice-chat';
import { StationDiscoveryFeed } from '@/components/station-discovery-feed';
import { isMockStation } from '@/lib/constants';
import { extractDominantColor } from '@/lib/color-extraction';

interface MinimalAlbumPlayerProps {
    stationId: string;
    onToggleView?: () => void;
}

export function MinimalAlbumPlayer({ stationId, onToggleView }: MinimalAlbumPlayerProps) {
    const { currentTrack, isPaused } = useSpotify();
    const { currentStation, joinStation, leaveStation } = useRadio();
    const [activeTab, setActiveTab] = useState<'chat' | 'queue' | 'stations' | 'voice' | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [currentUserId] = useState<string | null>('user-123');
    const [glowColor, setGlowColor] = useState('#6366f1');
    const sidebarRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        const albumUrl = currentTrack?.album?.images?.[0]?.url;
        if (albumUrl) {
            extractDominantColor(albumUrl).then(setGlowColor);
        }
    }, [currentTrack?.album?.images]);

    // Click outside sidebar to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeTab && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setActiveTab(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeTab]);

    const tabButtons = [
        { id: 'stations' as const, icon: Radio, label: 'Stations' },
        { id: 'chat' as const, icon: MessageCircle, label: 'Chat' },
        { id: 'queue' as const, icon: ListMusic, label: 'Queue' },
        { id: 'voice' as const, icon: Mic, label: 'Voice' },
    ];

    const albumUrl = currentTrack?.album?.images?.[0]?.url;

    return (
        <div className="h-screen w-full relative overflow-hidden bg-black">

            {/* Ambient background glow */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                    background: `radial-gradient(ellipse at 50% 40%, ${glowColor}15 0%, transparent 60%)`
                }}
                transition={{ duration: 1.5 }}
            />

            {/* TOP RIGHT: Menu Button + View Toggle */}
            <div className="absolute top-4 right-4 z-50 flex gap-3">
                {/* Menu Button */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white font-semibold text-sm flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10"
                >
                    {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    <span>Menu</span>
                </button>

                {/* View Toggle */}
                {onToggleView && (
                    <button
                        onClick={onToggleView}
                        className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white font-semibold text-sm flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span>Views</span>
                    </button>
                )}
            </div>

            {/* Dropdown Menu for Features */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-16 right-4 z-50 bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden"
                    >
                        {tabButtons.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setMenuOpen(false);
                                }}
                                className={cn(
                                    "w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-white/10 transition-all",
                                    activeTab === tab.id ? "bg-white/10 text-white" : "text-white/70"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT - Album + Track Info + Controls */}
            <div className="h-full w-full flex flex-col items-center justify-center px-4">

                {/* ALBUM ARTWORK - MAX WIDTH */}
                <motion.div
                    className="relative mb-6"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Ambient glow behind album */}
                    <motion.div
                        className="absolute -inset-8 rounded-2xl blur-[60px] opacity-40"
                        animate={{ backgroundColor: glowColor }}
                        transition={{ duration: 1 }}
                    />

                    {/* Album with border - MAX WIDTH */}
                    <div
                        className="relative rounded-lg overflow-hidden"
                        style={{
                            width: '96vw',
                            height: 'min(55vh, 96vw)',
                            maxHeight: '60vh',
                            minWidth: '300px',
                            minHeight: '200px',
                            border: `2px solid rgba(255,255,255,0.1)`,
                            boxShadow: `0 40px 100px rgba(0,0,0,0.7)`
                        }}
                    >
                        {albumUrl ? (
                            <Image
                                src={albumUrl}
                                alt="Album Art"
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                <div className="text-white/15 text-8xl font-black">♪</div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* TRACK INFO - Below album, bold and larger */}
                <motion.div
                    className="text-center mb-5 w-full max-w-4xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h1
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none truncate"
                        style={{ textShadow: `0 0 50px ${glowColor}60` }}
                    >
                        {currentTrack?.name || 'No Track'}
                    </h1>
                    <p className="text-xl sm:text-2xl md:text-3xl text-white/60 mt-2 font-bold truncate">
                        {currentTrack?.artists?.[0]?.name || 'Unknown Artist'}
                    </p>
                    <p className="text-base sm:text-lg md:text-xl text-white/40 mt-1 font-medium truncate">
                        {currentTrack?.album?.name || 'Unknown Album'}
                    </p>
                </motion.div>

                {/* CONTROLS - Minimal */}
                <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Progress Bar */}
                    <div className="w-[300px] sm:w-[400px] md:w-[500px]">
                        <div className="h-1 bg-white/15 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: glowColor }}
                                initial={{ width: '0%' }}
                                animate={{ width: '33%' }}
                            />
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs text-white/40 font-mono">
                            <span>1:24</span>
                            <span>4:02</span>
                        </div>
                    </div>

                    {/* Playback Buttons */}
                    <div className="flex items-center gap-5">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all"
                        >
                            <SkipBack className="w-4 h-4 fill-current" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                            style={{
                                backgroundColor: glowColor,
                                boxShadow: `0 0 40px ${glowColor}50`
                            }}
                        >
                            {isPaused ? (
                                <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                            ) : (
                                <Pause className="w-5 h-5 fill-white text-white" />
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all"
                        >
                            <SkipForward className="w-4 h-4 fill-current" />
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* Sidebar - Click outside to close */}
            <AnimatePresence>
                {activeTab && displayStation && (
                    <>
                        {/* Backdrop overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-[90]"
                            onClick={() => setActiveTab(null)}
                        />

                        <motion.div
                            ref={sidebarRef}
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 22 }}
                            className="fixed top-0 right-0 h-full w-full md:w-96 z-[100]"
                            style={{
                                background: `rgba(0, 0, 0, 0.95)`,
                                backdropFilter: `blur(30px)`,
                                borderLeft: `1px solid rgba(255,255,255,0.08)`
                            }}
                        >
                            <div className="h-full flex flex-col p-6">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                                    <h2 className="font-bold text-lg text-white uppercase tracking-wider">{activeTab}</h2>
                                    <button onClick={() => setActiveTab(null)} className="p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20">
                                        <X className="w-4 h-4" />
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
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

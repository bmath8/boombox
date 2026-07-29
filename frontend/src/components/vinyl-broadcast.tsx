'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRadio } from '@/lib/radio-station';
import { useSpotify } from '@/lib/spotify-sdk';
import { EnhancedStationChat } from '@/components/enhanced-station-chat';
import { SongRequestQueue } from '@/components/song-request-queue';
import { DJQueuePanel } from '@/components/dj-queue-panel';
import { TrackVotingControls } from '@/components/track-voting-controls';
import { VoiceChat } from '@/components/voice-chat';
import { StationDiscoveryFeed } from '@/components/station-discovery-feed';
import { EnhancedVisualizer } from '@/components/enhanced-visualizer';
import { KeyboardShortcutsPanel } from '@/components/keyboard-shortcuts-panel';
import { Users, Share2, LogOut, Music2, MessageCircle, ListMusic, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Mic, Sparkles } from 'lucide-react';
import { MobileFeaturesPanel } from '@/components/mobile-features-panel';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { isMockStation } from '@/lib/constants';
import { extractDominantColor } from '@/lib/color-extraction';
import { StraightTonearm } from '@/components/boombox/StraightTonearm';

interface VinylBroadcastProps {
    stationId: string;
}

export function VinylBroadcast({ stationId }: VinylBroadcastProps) {
    const { currentStation, joinStation, leaveStation } = useRadio();
    const { currentTrack, isPaused } = useSpotify();
    const [activeTab, setActiveTab] = useState<'chat' | 'queue' | 'requests' | 'stations' | 'voice' | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>('user-123');

    // Dynamic theme color from album art
    const [themeColor, setThemeColor] = useState('#ff3333');
    const [isScratching, setIsScratching] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showFeatures, setShowFeatures] = useState(false);

    // Framer Motion values for vinyl rotation
    const recordRotation = useMotionValue(0);

    // Keyboard shortcuts listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === '?' || (e.shiftKey && e.key === '/')) {
                e.preventDefault();
                setShowShortcuts(prev => !prev);
            }
            if (e.key === 'Escape' && showShortcuts) {
                setShowShortcuts(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showShortcuts]);

    // Extract dominant color from album art
    useEffect(() => {
        const albumArtUrl = currentTrack?.album?.images?.[0]?.url;
        if (albumArtUrl) {
            extractDominantColor(albumArtUrl).then(setThemeColor);
        } else {
            setThemeColor('#ff3333'); // Default red
        }
    }, [currentTrack?.album?.images]);

    useEffect(() => {
        // Don't try to join mock stations via database - they're for demo/testing only
        if (stationId && !isMockStation(stationId)) {
            joinStation(stationId);
        }
        return () => {
            if (currentStation?.station_id === stationId && !isMockStation(stationId)) {
                void leaveStation();
            }
        };
    }, [stationId, joinStation, leaveStation, currentStation]);

    // Mock for visual verification if station is loading or test-station/lobby
    const displayStation = currentStation || (['test-station', 'lobby'].includes(stationId) ? {
        station_id: stationId,
        station_name: stationId === 'lobby' ? 'BOOMBOX Radio' : 'Neon Nights FM',
        broadcaster_id: 'user-123',
        status: 'live',
        listener_count: stationId === 'lobby' ? 256 : 128,
        current_track: null
    } : null);

    if (!displayStation) {
        return (
            <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center font-mono text-[#666]">
                <div className="animate-pulse">INITIALIZING PLAYER...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white overflow-hidden relative font-sans selection:bg-[#ff3333] selection:text-white">

            {/* Main Container - Responsive padding */}
            <div className="max-w-7xl mx-auto px-4 py-4 md:p-8 h-screen flex flex-col">

                {/* Header - Responsive */}
                <header className="flex flex-col md:flex-row justify-between items-center md:items-start mb-6 md:mb-12 relative z-40 gap-4">
                    <div className="text-center md:text-left">
                        <h1 className="font-black text-3xl md:text-4xl lg:text-5xl tracking-tighter leading-none">
                            VINYL<br />
                            <motion.span
                                animate={{ color: themeColor }}
                                transition={{ duration: 0.8 }}
                            >
                                PLAYER
                            </motion.span>
                        </h1>
                    </div>
                    {/* Status badge - responsive positioning */}
                    <motion.div
                        className="px-3 md:px-4 py-1 md:py-1.5 rounded-sm md:mr-[350px]"
                        animate={{
                            backgroundColor: themeColor,
                            boxShadow: `0 0 15px ${themeColor}60`
                        }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="font-bold text-xs tracking-[0.2em] text-black flex items-center gap-2">
                            <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                            {isPaused ? 'PAUSED' : 'PLAYING'}
                        </span>
                    </motion.div>

                    {/* Animated Listener Count - Hidden on mobile */}
                    <motion.div
                        className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2 bg-[#1a1a1a]/80 px-4 py-2 rounded-full border border-[#333] backdrop-blur-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <Users className="w-4 h-4 text-[#888]" />
                        </motion.div>
                        <motion.span
                            key={displayStation?.listener_count || 0}
                            initial={{ scale: 1.5, color: themeColor }}
                            animate={{ scale: 1, color: '#ffffff' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                            className="font-bold text-sm tabular-nums"
                        >
                            {displayStation?.listener_count || 1}
                        </motion.span>
                        <span className="text-xs text-[#888] uppercase tracking-wider">listening</span>
                    </motion.div>
                </header>

                {/* Player Content - Responsive gap */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 lg:gap-24 items-center">

                    {/* Left: Vinyl Record - Responsive sizing */}
                    <div className="lg:col-span-5 flex justify-center relative px-4 md:px-8">

                        {/* Visualizer Background - Responsive */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none scale-125 md:scale-150">
                            <div className="w-[280px] h-[280px] md:w-[350px] md:h-[350px] lg:w-[400px] lg:h-[400px]">
                                <EnhancedVisualizer
                                    isPlaying={!isPaused}
                                    theme="neon"
                                    showControls={false}
                                    visualizationStyle="circular"
                                />
                            </div>
                        </div>

                        {/* Dynamic Glow Effect */}
                        <motion.div
                            className="absolute inset-0 opacity-10 blur-[100px] rounded-full transform scale-150"
                            animate={{ backgroundColor: themeColor }}
                            transition={{ duration: 1.5 }}
                        />

                        {/* Record Container (Turntable Base) - Responsive */}
                        <div className="relative w-[300px] h-[300px] md:w-[380px] md:h-[380px] lg:w-[420px] lg:h-[420px] flex items-center justify-center">
                            {/* Ambient Glow - Added Color Accent */}
                            <motion.div
                                className="absolute inset-0 rounded-full blur-[100px] opacity-20"
                                animate={{ backgroundColor: themeColor }}
                                transition={{ duration: 2 }}
                            />

                            {/* Turntable Platter - Responsive */}
                            <div className="relative w-[280px] h-[280px] md:w-[360px] md:h-[360px] lg:w-[400px] lg:h-[400px] rounded-full bg-[#0a0a0a] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center group">
                                {/* Outer Ring Glow - Audio Reactive Pulse */}
                                <motion.div
                                    className="absolute inset-0 rounded-full border-2 transition-colors duration-500"
                                    animate={{
                                        borderColor: isPaused ? '#333' : themeColor,
                                        boxShadow: isPaused
                                            ? 'none'
                                            : [
                                                `0 0 20px ${themeColor}30`,
                                                `0 0 40px ${themeColor}50`,
                                                `0 0 20px ${themeColor}30`
                                            ]
                                    }}
                                    transition={{
                                        boxShadow: {
                                            repeat: Infinity,
                                            duration: 1.5,
                                            ease: "easeInOut"
                                        }
                                    }}
                                />

                                {/* Spinning Record - Responsive */}
                                <motion.div
                                    className="relative w-[260px] h-[260px] md:w-[340px] md:h-[340px] lg:w-[380px] lg:h-[380px] rounded-full bg-[#111] shadow-inner flex items-center justify-center"
                                    animate={{
                                        rotate: !isPaused && !isScratching ? 360 : 0
                                    }}
                                    transition={{
                                        rotate: {
                                            repeat: Infinity,
                                            duration: 4,
                                            ease: "linear"
                                        }
                                    }}
                                    style={{ rotate: recordRotation }}
                                    whileTap={{ cursor: 'grabbing' }}
                                >
                                    {/* Vinyl Grooves - Enhanced */}
                                    <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(#111_0,#111_2px,#1a1a1a_3px)] opacity-50" />

                                    {/* Realistic Light Reflection Overlay */}
                                    <div
                                        className="absolute inset-0 rounded-full pointer-events-none"
                                        style={{
                                            background: `conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.03) 60deg, transparent 120deg, rgba(255,255,255,0.05) 180deg, transparent 240deg, rgba(255,255,255,0.02) 300deg, transparent 360deg)`
                                        }}
                                    />

                                    {/* Secondary shimmer layer */}
                                    <motion.div
                                        className="absolute inset-0 rounded-full pointer-events-none opacity-30"
                                        animate={{ rotate: -360 }}
                                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                                        style={{
                                            background: `conic-gradient(from 45deg, transparent 0%, rgba(255,255,255,0.1) 25%, transparent 50%, rgba(255,255,255,0.08) 75%, transparent 100%)`
                                        }}
                                    />

                                    {/* Vinyl Wear Effect - Dust & Scratches */}
                                    <div
                                        className="absolute inset-0 rounded-full pointer-events-none opacity-20"
                                        style={{
                                            background: `
                                                radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 2%),
                                                radial-gradient(circle at 70% 60%, rgba(255,255,255,0.08) 0%, transparent 1.5%),
                                                radial-gradient(circle at 45% 80%, rgba(255,255,255,0.06) 0%, transparent 1%),
                                                radial-gradient(circle at 80% 30%, rgba(255,255,255,0.07) 0%, transparent 1.2%),
                                                radial-gradient(circle at 20% 70%, rgba(255,255,255,0.05) 0%, transparent 0.8%),
                                                linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.02) 50%, transparent 55%),
                                                linear-gradient(225deg, transparent 40%, rgba(255,255,255,0.015) 50%, transparent 60%)
                                            `
                                        }}
                                    />

                                    {/* Album Art / Center Label - Responsive */}
                                    <motion.div
                                        className="relative w-[90px] h-[90px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px] rounded-full overflow-hidden border-2 md:border-4 border-[#1a1a1a]"
                                        animate={{
                                            boxShadow: `0 0 30px ${themeColor}40`
                                        }}
                                        transition={{ duration: 1.5 }}
                                    >
                                        <AnimatePresence mode="wait">
                                            {currentTrack?.album?.images?.[0]?.url ? (
                                                <motion.div
                                                    key={currentTrack.id || currentTrack.uri}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 1.1 }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                    className="absolute inset-0"
                                                >
                                                    <Image
                                                        src={currentTrack.album.images[0].url}
                                                        alt="Album Art"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="no-track"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="w-full h-full bg-[#222] flex items-center justify-center"
                                                >
                                                    <Music2 className="w-8 h-8 text-[#444]" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        {/* Dynamic Ring around label */}
                                        <motion.div
                                            className="absolute inset-0 rounded-full border-2 opacity-60"
                                            animate={{ borderColor: themeColor }}
                                            transition={{ duration: 1 }}
                                        />
                                        {/* Center spindle */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#333] border-2 border-[#222]" />
                                    </motion.div>
                                </motion.div>
                            </div>

                            {/* STRAIGHT TONEARM COMPONENT */}
                            <StraightTonearm isPaused={isPaused} themeColor={themeColor} />
                        </div>
                    </div>

                    {/* Right: Info & Controls - Responsive */}
                    <div className="lg:col-span-7 space-y-6 md:space-y-12 text-center lg:text-left">

                        {/* Track Metadata - Responsive fonts */}
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-4xl lg:text-6xl font-black tracking-tight leading-none uppercase">
                                {currentTrack?.name || 'NO TRACK'}
                            </h2>
                            <motion.h3
                                className="text-lg md:text-2xl lg:text-3xl font-bold uppercase tracking-wide"
                                animate={{ color: themeColor }}
                                transition={{ duration: 0.8 }}
                            >
                                {currentTrack?.artists[0]?.name || 'SELECT A STATION'}
                            </motion.h3>
                            <p className="text-[#666] font-mono text-sm tracking-widest uppercase mt-4">
                                {currentTrack?.album?.name || 'UNKNOWN ALBUM'} • {new Date().getFullYear()}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <motion.div
                                className="flex justify-between font-mono text-xs font-bold"
                                animate={{ color: themeColor }}
                                transition={{ duration: 0.5 }}
                            >
                                <span>00:00</span>
                                <span>04:02</span>
                            </motion.div>
                            <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full w-1/3"
                                    animate={{
                                        backgroundColor: themeColor,
                                        boxShadow: `0 0 10px ${themeColor}80`
                                    }}
                                    transition={{ duration: 0.8 }}
                                />
                            </div>
                        </div>

                        {/* Controls - Touch optimized */}
                        <div className="flex items-center justify-center lg:justify-start gap-4 md:gap-6">
                            <motion.button
                                className="w-14 h-14 border-2 flex items-center justify-center transition-all group rounded-full"
                                animate={{
                                    borderColor: `${themeColor}40`, // Subtle border accent
                                    color: themeColor
                                }}
                                whileHover={{
                                    borderColor: themeColor,
                                    backgroundColor: themeColor,
                                    color: '#000'
                                }}
                            >
                                <SkipBack className="w-6 h-6 fill-current" />
                            </motion.button>

                            <motion.button
                                className="w-20 h-20 flex items-center justify-center text-black transition-all"
                                animate={{
                                    backgroundColor: themeColor,
                                    boxShadow: `0 0 30px ${themeColor}50`
                                }}
                                whileHover={{
                                    backgroundColor: '#fff',
                                    boxShadow: '0 0 40px rgba(255,255,255,0.4)'
                                }}
                            >
                                {isPaused ? <Play className="w-10 h-10 fill-current ml-1" /> : <Pause className="w-10 h-10 fill-current" />}
                            </motion.button>

                            <motion.button
                                className="w-14 h-14 border-2 flex items-center justify-center transition-all group rounded-full"
                                animate={{
                                    borderColor: `${themeColor}40`, // Subtle border accent
                                    color: themeColor
                                }}
                                whileHover={{
                                    borderColor: themeColor,
                                    backgroundColor: themeColor,
                                    color: '#000'
                                }}
                            >
                                <SkipForward className="w-6 h-6 fill-current" />
                            </motion.button>

                            <div className="w-px h-14 bg-[#333] mx-4" />

                            <motion.button
                                className="w-14 h-14 border-2 border-[#333] flex items-center justify-center text-[#666] transition-all"
                                whileHover={{
                                    borderColor: themeColor,
                                    color: themeColor
                                }}
                            >
                                <Shuffle className="w-6 h-6" />
                            </motion.button>

                            <motion.button
                                className="w-14 h-14 border-2 border-[#333] flex items-center justify-center text-[#666] transition-all"
                                whileHover={{
                                    borderColor: themeColor,
                                    color: themeColor
                                }}
                            >
                                <Repeat className="w-6 h-6" />
                            </motion.button>

                            <div className="flex-1 flex items-center justify-end gap-4 ml-8">
                                <Volume2 className="w-5 h-5 text-[#666]" />
                                <div className="w-24 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                                    <motion.div
                                        className="w-2/3 h-full"
                                        animate={{ backgroundColor: themeColor }}
                                        transition={{ duration: 0.8 }}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer: Up Next */}
                <div className="mt-auto border-t border-[#2a2a2a] pt-8">
                    <motion.h4
                        className="font-black uppercase tracking-widest mb-6"
                        animate={{ color: themeColor }}
                        transition={{ duration: 0.8 }}
                    >
                        Up Next
                    </motion.h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 hover:opacity-100 transition-opacity">
                        <motion.div
                            className="bg-[#222] p-4 flex items-center gap-4 border-l-4"
                            animate={{ borderColor: themeColor }}
                            transition={{ duration: 0.8 }}
                        >
                            <motion.span
                                className="font-black text-xl"
                                animate={{ color: themeColor }}
                            >
                                01
                            </motion.span>
                            <div>
                                <div className="font-bold text-white uppercase">Midnight City</div>
                                <div className="text-xs text-[#888] uppercase">Neon Waves</div>
                            </div>
                            <div className="ml-auto font-mono text-xs text-[#666]">04:12</div>
                        </motion.div>
                    </div>
                </div>

            </div>

            {/* Sidebar Toggle (Floating) */}
            <div className="fixed right-8 top-8 flex gap-2 z-50">
                <button
                    onClick={() => setActiveTab(activeTab === 'stations' ? null : 'stations')}
                    className={cn("px-4 py-2 rounded-lg border border-[#333] bg-[#1a1a1a]/90 backdrop-blur-sm text-[#888] hover:text-[#ff3333] hover:border-[#ff3333] transition-all uppercase font-bold text-xs tracking-widest", activeTab === 'stations' && "bg-[#ff3333] text-black border-[#ff3333]")}
                >
                    Stations
                </button>
                <button
                    onClick={() => setActiveTab(activeTab === 'chat' ? null : 'chat')}
                    className={cn("px-4 py-2 rounded-lg border border-[#333] bg-[#1a1a1a]/90 backdrop-blur-sm text-[#888] hover:text-[#ff3333] hover:border-[#ff3333] transition-all uppercase font-bold text-xs tracking-widest", activeTab === 'chat' && "bg-[#ff3333] text-black border-[#ff3333]")}
                >
                    Chat
                </button>
                <button
                    onClick={() => setActiveTab(activeTab === 'queue' ? null : 'queue')}
                    className={cn("px-4 py-2 rounded-lg border border-[#333] bg-[#1a1a1a]/90 backdrop-blur-sm text-[#888] hover:text-[#ff3333] hover:border-[#ff3333] transition-all uppercase font-bold text-xs tracking-widest", activeTab === 'queue' && "bg-[#ff3333] text-black border-[#ff3333]")}
                >
                    Queue
                </button>
                <button
                    onClick={() => setActiveTab(activeTab === 'voice' ? null : 'voice')}
                    className={cn("px-4 py-2 rounded-lg border border-[#333] bg-[#1a1a1a]/90 backdrop-blur-sm text-[#888] hover:text-[#ff3333] hover:border-[#ff3333] transition-all uppercase font-bold text-xs tracking-widest flex items-center gap-1.5", activeTab === 'voice' && "bg-[#ff3333] text-black border-[#ff3333]")}
                >
                    <Mic className="w-3 h-3" />
                    Voice
                </button>
                <button
                    onClick={() => setShowFeatures(true)}
                    className="px-4 py-2 rounded-lg border border-[#333] bg-[#1a1a1a]/90 backdrop-blur-sm text-[#888] hover:text-[#ff3333] hover:border-[#ff3333] transition-all uppercase font-bold text-xs tracking-widest flex items-center gap-1.5"
                >
                    <Sparkles className="w-3 h-3" />
                    Features
                </button>
            </div>

            {/* Sidebar Content Overlay - starts below the tab buttons */}
            <AnimatePresence>
                {activeTab && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="fixed top-20 right-0 h-[calc(100vh-5rem)] w-96 bg-[#111]/95 backdrop-blur-md border-l border-[#333] z-40 shadow-2xl overflow-hidden rounded-tl-xl"
                    >
                        <div className="h-full flex flex-col p-6">
                            <div className="flex justify-between items-center mb-6 border-b border-[#333] pb-4">
                                <h2 className="font-black text-xl text-white uppercase tracking-wide">
                                    {activeTab}
                                </h2>
                                <button onClick={() => setActiveTab(null)} className="p-2 rounded-lg bg-white/5 text-[#666] hover:text-[#ff3333] hover:bg-white/10 transition-all">
                                    <LogOut className="w-4 h-4 rotate-180" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {activeTab === 'chat' && <EnhancedStationChat stationId={displayStation.station_id} isBroadcaster={displayStation.broadcaster_id === currentUserId} />}
                                {activeTab === 'queue' && (
                                    <DJQueuePanel
                                        stationId={displayStation.station_id}
                                        currentUserId={currentUserId}
                                        isBroadcaster={displayStation.broadcaster_id === currentUserId}
                                    />
                                )}
                                {activeTab === 'requests' && <SongRequestQueue />}
                                {activeTab === 'voice' && (
                                    <VoiceChat
                                        stationId={displayStation.station_id}
                                        isBroadcaster={displayStation.broadcaster_id === currentUserId}
                                    />
                                )}
                                {activeTab === 'stations' && (
                                    <StationDiscoveryFeed />
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keyboard Shortcuts Panel */}
            <KeyboardShortcutsPanel
                isOpen={showShortcuts}
                onClose={() => setShowShortcuts(false)}
            />

            {/* Mobile Features Panel Global Access */}
            <MobileFeaturesPanel isOpen={showFeatures} onClose={() => setShowFeatures(false)} />
        </div>
    );
}

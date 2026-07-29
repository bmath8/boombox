'use client';

import { useState, useEffect } from 'react';
import { useSpotify } from '@/lib/spotify-sdk';
import { useRadio } from '@/lib/radio-station';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Music2, LayoutGrid, MessageCircle, ListMusic, Radio, Mic, Users, LogOut, Moon, Sun, Wifi, WifiOff, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { extractDominantColor } from '@/lib/color-extraction';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedStationChat } from '@/components/enhanced-station-chat';
import { DJQueuePanel } from '@/components/dj-queue-panel';
import { VoiceChat } from '@/components/voice-chat';
import { StationDiscoveryFeed } from '@/components/station-discovery-feed';
import { MobileFeaturesPanel } from '@/components/mobile-features-panel';
import { StraightTonearm } from '@/components/boombox/StraightTonearm';
import { isMockStation } from '@/lib/constants';
import { useIOSHaptics } from '@/hooks/use-ios-haptics';
import { useARAlbumArt } from '@/hooks/use-ar-album-art';
import { useMediaWakeLock } from '@/hooks/use-wake-lock';
import { useNetworkStatus } from '@/hooks/use-network-status';
import {
    updateMediaSessionMetadata,
    updateMediaSessionPlaybackState,
    registerMediaSessionHandlers,
    clearMediaSession
} from '@/lib/media-session-handler';

interface MobilePlayerProps {
    stationId: string;
    onToggleView?: () => void;
}

export function MobilePlayer({ stationId, onToggleView }: MobilePlayerProps) {
    const { currentTrack, isPaused } = useSpotify();
    const { currentStation, joinStation, leaveStation } = useRadio();
    const [themeColor, setThemeColor] = useState('#ff6b00');
    const [volume, setVolume] = useState(70);
    const [activeTab, setActiveTab] = useState<'chat' | 'queue' | 'stations' | 'voice' | null>(null);
    const [currentUserId] = useState<string | null>('user-123');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showFeaturesPanel, setShowFeaturesPanel] = useState(false);

    // Mobile enhancements
    const { triggerHaptic, isSupported: isHapticSupported } = useIOSHaptics();
    const { isActive: isWakeLockActive } = useMediaWakeLock(!isPaused);
    const { tiltProps, glareProps } = useARAlbumArt(); // Premium 3D Art
    const network = useNetworkStatus();

    // Load dark mode preference
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('mobile-player-dark-mode');
        if (savedDarkMode === 'true') {
            setIsDarkMode(true);
        }
    }, []);

    // Toggle dark mode
    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('mobile-player-dark-mode', String(newMode));
    };

    // Theme colors based on dark mode - Concept 1: Premium Vinyl with deep purple
    const darkModeAccent = '#a855f7'; // Purple for dark mode
    const computedEffectiveColor = isDarkMode ? darkModeAccent : themeColor;

    // Mock station for visual verification
    const displayStation = currentStation || (['test-station', 'lobby'].includes(stationId) ? {
        station_id: stationId,
        station_name: stationId === 'lobby' ? 'BOOMBOX Radio' : 'Neon Nights FM',
        broadcaster_id: 'user-123',
        status: 'live',
        listener_count: stationId === 'lobby' ? 256 : 128,
        current_track: null
    } : null);

    // Join station on mount
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

    // Extract dominant color from album art
    useEffect(() => {
        const albumArtUrl = currentTrack?.album?.images?.[0]?.url;
        if (albumArtUrl) {
            extractDominantColor(albumArtUrl).then(setThemeColor);
        } else {
            setThemeColor('#ff6b00');
        }
    }, [currentTrack?.album?.images]);

    // Update Media Session API with current track
    useEffect(() => {
        if (currentTrack) {
            updateMediaSessionMetadata({
                title: currentTrack.name,
                artist: currentTrack.artists?.[0]?.name || 'Unknown Artist',
                album: currentTrack.album?.name || 'Unknown Album',
                artwork: currentTrack.album?.images?.map(img => ({
                    src: img.url,
                    sizes: `${(img as any).width || 512}x${(img as any).height || 512}`,
                    type: 'image/jpeg'
                }))
            });
            updateMediaSessionPlaybackState(isPaused ? 'paused' : 'playing');
        } else {
            clearMediaSession();
        }

        return () => {
            clearMediaSession();
        };
    }, [currentTrack, isPaused]);

    // Register Media Session action handlers
    useEffect(() => {
        registerMediaSessionHandlers({
            onPlay: () => {
                // Trigger play action (connect to Spotify SDK)
                // console.log('[MediaSession] Play requested');
            },
            onPause: () => {
                // Trigger pause action
                // console.log('[MediaSession] Pause requested');
            },
            onNext: () => {
                // Skip to next track
                // console.log('[MediaSession] Next track requested');
                triggerHaptic('light');
            },
            onPrevious: () => {
                // Skip to previous track
                // console.log('[MediaSession] Previous track requested');
                triggerHaptic('light');
            },
        });
    }, [triggerHaptic]);

    const tabButtons = [
        { id: 'stations' as const, icon: Radio, label: 'Stations' },
        { id: 'chat' as const, icon: MessageCircle, label: 'Chat' },
        { id: 'queue' as const, icon: ListMusic, label: 'Queue' },
        { id: 'voice' as const, icon: Mic, label: 'Voice' },
    ];

    // Haptic feedback handlers
    const handlePlayPause = () => {
        triggerHaptic('medium');
        // Add actual play/pause logic here
    };

    const handleSkip = () => {
        triggerHaptic('light');
        // Add actual skip logic here
    };

    const handleTabClick = (tabId: typeof activeTab) => {
        triggerHaptic('light');
        setActiveTab(activeTab === tabId ? null : tabId);
    };

    return (
        <div
            className="min-h-screen w-full relative overflow-hidden flex flex-col ios-safe-top ios-safe-bottom no-pull-refresh"
            style={{
                background: isDarkMode
                    ? `linear-gradient(180deg, #1a0a25 0%, #0a0510 40%, #030208 100%)` // Dark mode: Deep purple
                    : `linear-gradient(180deg, #1a0a20 0%, #0d0d12 40%, #050508 100%)` // Default
            }}
        >
            {/* Ambient glow from album colors */}
            <div
                className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[60%] blur-[100px] pointer-events-none",
                    isDarkMode ? "opacity-30" : "opacity-20"
                )}
                style={{ backgroundColor: computedEffectiveColor }}
            />

            {/* Header Bar */}
            <header className="relative z-50 flex items-center justify-between px-4 md:px-8 py-4">
                {/* Station Info */}
                <div className="flex items-center gap-2 md:gap-3">
                    <motion.div
                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        animate={{ backgroundColor: computedEffectiveColor }}
                    >
                        <span className="text-black flex items-center gap-2">
                            <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                            {isPaused ? 'PAUSED' : 'LIVE'}
                        </span>
                    </motion.div>
                    {/* Network Status Indicator */}
                    {!network.isOnline && (
                        <div className="px-2 py-1 rounded-full bg-red-500/20 flex items-center gap-1">
                            <WifiOff className="w-3 h-3 text-red-400" />
                            <span className="text-xs text-red-400 font-medium">Offline</span>
                        </div>
                    )}
                    {network.isOnline && network.saveData && (
                        <div className="px-2 py-1 rounded-full bg-yellow-500/20 flex items-center gap-1">
                            <span className="text-xs text-yellow-400 font-medium">Data Saver</span>
                        </div>
                    )}
                    <div className="hidden md:flex items-center gap-2 text-white/60 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{displayStation?.listener_count || 1} listening</span>
                    </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className={cn(
                            "p-3 rounded-full transition-all",
                            isDarkMode
                                ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                                : "glass-panel-light text-white/60 hover:text-white"
                        )}
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Features Hub (Testing) */}
                    <button
                        onClick={() => setShowFeaturesPanel(true)}
                        className="p-3 rounded-full glass-panel-light text-white/60 hover:text-white transition-colors"
                    >
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                    </button>

                    {/* Feature Tabs - Desktop */}
                    <div className="hidden md:flex items-center gap-2">
                        {tabButtons.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                                    activeTab === tab.id
                                        ? "text-black"
                                        : "glass-panel-light text-white/60 hover:text-white"
                                )}
                                style={activeTab === tab.id ? { backgroundColor: computedEffectiveColor } : {}}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Toggle View */}
                    {onToggleView && (
                        <button
                            onClick={onToggleView}
                            className="p-3 rounded-full glass-panel-light text-white/60 hover:text-white transition-colors"
                            title="Switch to Desktop View"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 md:py-8 relative z-10">

                {/* Vinyl Container - SCALED UP FOR WEB & 3D TILT ENABLED */}
                <div
                    className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[420px] md:h-[420px] lg:w-[480px] lg:h-[480px] cursor-pointer"
                    {...tiltProps} // Apply 3D Move events and transform
                    onClick={handlePlayPause}
                >

                    {/* Waveform Background (visualizer effect) */}
                    <div className="absolute inset-0 rounded-full waveform-pulse" style={{ transform: 'translateZ(-50px)' }}> {/* Push back depth */}
                        <div
                            className="absolute inset-0 rounded-full opacity-30"
                            style={{
                                background: `radial-gradient(circle, ${computedEffectiveColor}40 0%, transparent 70%)`
                            }}
                        />
                    </div>

                    {/* Glowing Orange Ring */}
                    <div
                        className={cn(
                            "absolute inset-0 rounded-full border-4 md:border-6 glow-ring",
                            isPaused && "opacity-50"
                        )}
                        style={{
                            borderColor: computedEffectiveColor,
                            boxShadow: `0 0 40px ${computedEffectiveColor}60, 0 0 80px ${computedEffectiveColor}30, 0 0 120px ${computedEffectiveColor}15`,
                            transform: 'translateZ(-20px)' // Slight depth
                        }}
                    />

                    {/* Vinyl Record */}
                    <div
                        className={cn(
                            "absolute inset-[8px] md:inset-[12px] rounded-full bg-[#0a0a0a] shadow-2xl",
                            !isPaused ? "vinyl-spin" : "vinyl-spin vinyl-spin-paused"
                        )}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Vinyl Grooves */}
                        <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(#111_0,#111_2px,#181818_3px)] opacity-60" />

                        {/* Light Reflection */}
                        <div
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                                background: `conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.05) 60deg, transparent 120deg, rgba(255,255,255,0.03) 240deg, transparent 360deg)`
                            }}
                        />

                        {/* Center Album Art */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] h-[45%] rounded-full overflow-hidden border-4 md:border-6 border-[#1a1a1a]"
                            style={{
                                boxShadow: `0 0 30px ${computedEffectiveColor}50`,
                                transform: 'translateZ(20px)' // Pop out
                            }}
                        >
                            {currentTrack?.album?.images?.[0]?.url ? (
                                <Image
                                    src={currentTrack.album.images[0].url}
                                    alt="Album Art"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                                    <Music2 className="w-10 h-10 md:w-16 md:h-16 text-[#444]" />
                                </div>
                            )}
                            {/* Center Spindle */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#222] border-2 border-[#333]" />

                            {/* Dynamic Glare Overlay */}
                            <div {...glareProps} />
                        </div>
                    </div>
                </div>

                {/* STRAIGHT TONEARM - MOBILE SCALED */}
                <div className="absolute top-[0px] left-[0px] w-full h-full pointer-events-none z-20" style={{ transform: 'translateZ(40px)' }}>
                    {/* Scale down slightly for mobile sizing alignment if needed, though w-full container helps */}
                    <div className="absolute top-[-20px] right-[-20px] transform scale-75 sm:scale-90 md:scale-100 origin-top-right">
                        <StraightTonearm isPaused={isPaused} themeColor={themeColor} />
                    </div>
                </div>

                {/* Track Info - SCALED UP FOR WEB */}
                <div className="mt-8 md:mt-12 text-center space-y-2 w-full max-w-[500px]">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight truncate">
                        {currentTrack?.name || 'NO TRACK'}
                    </h1>
                    <h2
                        className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-wide truncate"
                        style={{ color: computedEffectiveColor }}
                    >
                        {currentTrack?.artists?.[0]?.name || 'SELECT A STATION'}
                    </h2>
                    <p className="text-sm md:text-base text-white/40 font-mono uppercase tracking-wider">
                        {currentTrack?.album?.name || 'UNKNOWN ALBUM'}
                    </p>
                </div>

                {/* Progress Bar - SCALED UP */}
                <div className="mt-6 md:mt-10 w-full max-w-[500px] space-y-2">
                    <div className="flex justify-between text-xs md:text-sm font-mono" style={{ color: computedEffectiveColor }}>
                        <span>00:00</span>
                        <span>04:02</span>
                    </div>
                    <div className="h-2 md:h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full w-1/3 rounded-full"
                            style={{
                                backgroundColor: computedEffectiveColor,
                                boxShadow: `0 0 15px ${computedEffectiveColor}80`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Glassmorphism Control Panel - SCALED UP */}
            <div className="glass-panel rounded-t-3xl px-6 py-6 md:py-10 pb-8 md:pb-12 relative z-20">

                {/* Mobile Tab Bar */}
                <div className="md:hidden flex justify-center gap-4 mb-6 pb-4 border-b border-white/10">
                    {tabButtons.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                            className={cn(
                                "p-3 rounded-full transition-all",
                                activeTab === tab.id
                                    ? "text-black"
                                    : "text-white/50 hover:text-white"
                            )}
                            style={activeTab === tab.id ? { backgroundColor: computedEffectiveColor } : {}}
                        >
                            <tab.icon className="w-5 h-5" />
                        </button>
                    ))}
                </div>

                {/* Playback Controls - SCALED UP */}
                <div className="flex items-center justify-center gap-4 md:gap-8">
                    <button
                        onClick={() => triggerHaptic('light')}
                        className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                        style={{ pointerEvents: 'auto' }}
                        aria-label="Toggle shuffle"
                    >
                        <Shuffle className="w-5 h-5 md:w-6 md:h-6" />
                    </button>

                    <button
                        onClick={handleSkip}
                        className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full border-2 transition-all hover:scale-105 active:scale-95"
                        style={{
                            borderColor: computedEffectiveColor,
                            color: computedEffectiveColor,
                            pointerEvents: 'auto'
                        }}
                        aria-label="Previous track"
                    >
                        <SkipBack className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                    </button>

                    <button
                        onClick={handlePlayPause}
                        className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center rounded-full text-black transition-all hover:scale-105 active:scale-95"
                        style={{
                            backgroundColor: computedEffectiveColor,
                            boxShadow: `0 0 40px ${computedEffectiveColor}60`,
                            pointerEvents: 'auto'
                        }}
                        aria-label={isPaused ? 'Play' : 'Pause'}
                    >
                        {isPaused ? (
                            <Play className="w-10 h-10 md:w-12 md:h-12 fill-current ml-1" />
                        ) : (
                            <Pause className="w-10 h-10 md:w-12 md:h-12 fill-current" />
                        )}
                    </button>

                    <button
                        onClick={handleSkip}
                        className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full border-2 transition-all hover:scale-105 active:scale-95"
                        style={{
                            borderColor: computedEffectiveColor,
                            color: computedEffectiveColor,
                            pointerEvents: 'auto'
                        }}
                        aria-label="Next track"
                    >
                        <SkipForward className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                    </button>

                    <button
                        onClick={() => triggerHaptic('light')}
                        className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                        style={{ pointerEvents: 'auto' }}
                        aria-label="Toggle repeat"
                    >
                        <Repeat className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>

                {/* Volume Slider */}
                <div className="mt-6 md:mt-8 flex items-center justify-center gap-4 px-4">
                    <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-white/40" />
                    <div className="flex-1 max-w-[280px] h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${volume}%`,
                                backgroundColor: computedEffectiveColor
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Sidebar Panel Overlay */}
            <AnimatePresence>
                {activeTab && displayStation && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="fixed top-0 right-0 h-full w-full md:w-96 bg-[#111]/95 backdrop-blur-md border-l border-[#333] z-[100] shadow-2xl overflow-hidden"
                    >
                        <div className="h-full flex flex-col p-4 md:p-6">
                            <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-[#333] pb-4">
                                <h2 className="font-black text-lg md:text-xl text-white uppercase tracking-wide">
                                    {activeTab}
                                </h2>
                                <button
                                    onClick={() => setActiveTab(null)}
                                    className="p-2 rounded-lg bg-white/5 text-[#666] hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <LogOut className="w-4 h-4 rotate-180" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {activeTab === 'chat' && (
                                    <EnhancedStationChat
                                        stationId={displayStation.station_id}
                                        isBroadcaster={displayStation.broadcaster_id === currentUserId}
                                    />
                                )}
                                {activeTab === 'queue' && (
                                    <DJQueuePanel
                                        stationId={displayStation.station_id}
                                        currentUserId={currentUserId}
                                        isBroadcaster={displayStation.broadcaster_id === currentUserId}
                                    />
                                )}
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

            <MobileFeaturesPanel
                isOpen={showFeaturesPanel}
                onClose={() => setShowFeaturesPanel(false)}
            />
        </div>
    );
}

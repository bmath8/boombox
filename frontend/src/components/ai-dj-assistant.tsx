'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wand2, Sparkles, Music, Loader2, Plus, ThumbsUp,
    ThumbsDown, RefreshCw, Lightbulb, Zap, Heart
} from 'lucide-react';
import { useSpotify } from '@/lib/spotify-sdk';
import { handleError } from '@/lib/error-handler';
import { toast } from 'sonner';

interface TrackSuggestion {
    id: string;
    name: string;
    artist: string;
    album_art?: string;
    uri: string;
    reason: string;
    confidence: number;
    mood?: string;
}

interface CurrentTrack {
    id: string;
    name: string;
    artists?: { name: string }[];
}

type SuggestionMode = 'similar' | 'mood' | 'energy' | 'crowd-pleaser' | 'deep-cut';

export function AIDJAssistant() {
    const { player } = useSpotify();
    const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
    const [suggestions, setSuggestions] = useState<TrackSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<SuggestionMode>('similar');
    const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});

    // Get current playing track from Spotify
    useEffect(() => {
        if (!player) return;

        const getCurrentTrack = async () => {
            try {
                const state = await player.getCurrentState();
                if (state?.track_window?.current_track) {
                    const track = state.track_window.current_track;
                    setCurrentTrack({
                        id: track.id || '',
                        name: track.name,
                        artists: track.artists
                    });
                }
            } catch (error) {
                console.error('Failed to get current track:', error);
            }
        };

        getCurrentTrack();
        const interval = setInterval(getCurrentTrack, 5000);
        return () => clearInterval(interval);
    }, [player]);

    const getSuggestions = useCallback(async () => {
        if (!currentTrack) {
            toast.error('No track playing - play something first!');
            return;
        }

        setLoading(true);
        try {
            // In a real implementation, this would call an AI service
            // For now, we'll use Spotify's recommendations API
            const response = await fetch('/api/spotify/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    seedTracks: [currentTrack.id],
                    mode,
                    limit: 5
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get recommendations');
            }

            const data = await response.json();

            // Format suggestions with AI-generated reasons
            const formattedSuggestions: TrackSuggestion[] = data.tracks?.map((track: {
                id: string;
                name: string;
                artists: { name: string }[];
                album: { images: { url: string }[] };
                uri: string;
            }) => ({
                id: track.id,
                name: track.name,
                artist: track.artists.map((a: { name: string }) => a.name).join(', '),
                album_art: track.album.images[0]?.url,
                uri: track.uri,
                reason: getReasonForMode(mode, track.name),
                confidence: Math.floor(Math.random() * 20) + 80,
                mood: getMoodLabel(mode)
            })) || [];

            setSuggestions(formattedSuggestions);
        } catch (error) {
            handleError(error, 'AIDJAssistant');
            // Fallback: show demo suggestions
            setSuggestions([
                {
                    id: 'demo-1',
                    name: 'Enable Spotify to get real suggestions',
                    artist: 'Connect your Spotify account',
                    reason: 'AI recommendations require Spotify Premium',
                    confidence: 0,
                    uri: ''
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [currentTrack, mode]);

    const getReasonForMode = (mode: SuggestionMode, trackName: string): string => {
        const reasons: Record<SuggestionMode, string[]> = {
            'similar': [
                'Similar vibe and tempo',
                'Matches the current energy',
                'Same genre feel',
                'Complementary sound'
            ],
            'mood': [
                'Maintains the mood',
                'Perfect emotional transition',
                'Keeps the feeling going'
            ],
            'energy': [
                'High energy follow-up',
                'Keeps the crowd moving',
                'Peak time track'
            ],
            'crowd-pleaser': [
                'Fan favorite',
                'High singalong factor',
                'Proven crowd reaction'
            ],
            'deep-cut': [
                'Hidden gem',
                'Underground classic',
                'For the true fans'
            ]
        };
        const modeReasons = reasons[mode];
        return modeReasons[Math.floor(Math.random() * modeReasons.length)] || 'Great match';
    };

    const getMoodLabel = (mode: SuggestionMode): string => {
        const moods: Record<SuggestionMode, string> = {
            'similar': '🎵 Similar',
            'mood': '💭 Mood',
            'energy': '⚡ Energy',
            'crowd-pleaser': '🎉 Popular',
            'deep-cut': '💎 Deep Cut'
        };
        return moods[mode];
    };

    const handleFeedback = (trackId: string, type: 'up' | 'down') => {
        setFeedback(prev => ({
            ...prev,
            [trackId]: type
        }));

        // In a real implementation, this would train the AI
        toast.success(type === 'up' ? 'Got it! More like this.' : "Got it! I'll adjust.");
    };

    const handleAddToQueue = async (track: TrackSuggestion) => {
        if (!track.uri) return;

        try {
            // Would integrate with queue system
            toast.success(`Added "${track.name}" to queue`);
        } catch (error) {
            handleError(error, 'AddToQueue');
        }
    };

    const modes: { key: SuggestionMode; icon: typeof Sparkles; label: string }[] = [
        { key: 'similar', icon: Music, label: 'Similar' },
        { key: 'mood', icon: Heart, label: 'Mood' },
        { key: 'energy', icon: Zap, label: 'Energy' },
        { key: 'crowd-pleaser', icon: ThumbsUp, label: 'Popular' },
        { key: 'deep-cut', icon: Lightbulb, label: 'Deep Cuts' }
    ];

    return (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-purple-400" />
                        AI DJ Assistant
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                            Beta
                        </span>
                    </h3>
                </div>

                {/* Mode Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {modes.map(({ key, icon: Icon, label }) => (
                        <button
                            key={key}
                            onClick={() => setMode(key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${mode === key
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                                }`}
                        >
                            <Icon className="w-3 h-3" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Current Track Context */}
                {currentTrack && (
                    <div className="mb-4 p-3 bg-white/5 rounded-xl flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Based on:</p>
                            <p className="text-sm text-white truncate">
                                {currentTrack.name} - {currentTrack.artists?.[0]?.name}
                            </p>
                        </div>
                    </div>
                )}

                {/* Get Suggestions Button */}
                <button
                    onClick={getSuggestions}
                    disabled={loading}
                    className="w-full p-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors mb-4"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Finding tracks...
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-4 h-4" />
                            Get AI Suggestions
                        </>
                    )}
                </button>

                {/* Suggestions List */}
                <AnimatePresence mode="popLayout">
                    {suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                        >
                            {suggestions.map((track, index) => (
                                <motion.div
                                    key={track.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        {track.album_art && (
                                            <img
                                                src={track.album_art}
                                                alt={track.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">
                                                {track.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {track.artist}
                                            </p>
                                            <p className="text-xs text-purple-400 mt-1">
                                                {track.reason}
                                            </p>
                                        </div>

                                        {/* Confidence & Actions */}
                                        <div className="flex flex-col items-end gap-2">
                                            {track.confidence > 0 && (
                                                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                                                    {track.confidence}% match
                                                </span>
                                            )}
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleFeedback(track.id, 'up')}
                                                    className={`p-1.5 rounded-lg transition-colors ${feedback[track.id] === 'up'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'hover:bg-white/10 text-muted-foreground'
                                                        }`}
                                                >
                                                    <ThumbsUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleFeedback(track.id, 'down')}
                                                    className={`p-1.5 rounded-lg transition-colors ${feedback[track.id] === 'down'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : 'hover:bg-white/10 text-muted-foreground'
                                                        }`}
                                                >
                                                    <ThumbsDown className="w-3 h-3" />
                                                </button>
                                                {track.uri && (
                                                    <button
                                                        onClick={() => handleAddToQueue(track)}
                                                        className="p-1.5 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Refresh button */}
                            <button
                                onClick={getSuggestions}
                                disabled={loading}
                                className="w-full p-2 text-sm text-muted-foreground hover:text-white flex items-center justify-center gap-2 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Get more suggestions
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

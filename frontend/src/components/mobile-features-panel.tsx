'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Music, Activity, Globe, Mic,
    Gamepad2, Calendar, Newspaper, Headphones,
    Moon, Zap, Ticket, Radio, ChevronRight, X,
    Maximize2, PlayCircle, PauseCircle, SkipForward,
    Volume2, Sliders
} from 'lucide-react';
import { MobileBottomSheet } from '@/components/mobile-bottom-sheet';
import { cn } from '@/lib/utils';

// Import all feature hooks
import { useMusicNews } from '@/hooks/use-music-news';
import { useConcertDiscovery } from '@/hooks/use-concert-discovery';
import { useMusicTrivia } from '@/hooks/use-music-trivia';
import { useWorkoutMode } from '@/hooks/use-workout-mode';
import { useSleepTimer } from '@/hooks/use-sleep-timer';
import { useArtistRadio } from '@/hooks/use-artist-radio';
import { usePodcastIntegration } from '@/hooks/use-podcast-integration';
import { useEqualizer } from '@/hooks/use-equalizer';
import { useKaraokeMode } from '@/hooks/use-karaoke-mode';
import { use3DAudio } from '@/hooks/use-3d-audio';
import { useStudyTimer } from '@/hooks/use-study-timer';
import { useARAlbumArt } from '@/hooks/use-ar-album-art';

interface MobileFeaturesPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileFeaturesPanel({ isOpen, onClose }: MobileFeaturesPanelProps) {
    const [activeFeature, setActiveFeature] = useState<string | null>(null);

    const categories = [
        {
            title: 'Audio & FX',
            items: [
                { id: 'eq', label: 'Equalizer', icon: Music, color: 'text-blue-400' },
                { id: 'karaoke', label: 'Karaoke Mode', icon: Mic, color: 'text-purple-400' },
                { id: '3d', label: '3D Audio', icon: Headphones, color: 'text-indigo-400' },
            ]
        },
        {
            title: 'Lifestyle',
            items: [
                { id: 'workout', label: 'Workout Mode', icon: Activity, color: 'text-red-400' },
                { id: 'sleep', label: 'Sleep Timer', icon: Moon, color: 'text-indigo-300' },
                { id: 'focus', label: 'Focus Timer', icon: Zap, color: 'text-yellow-400' },
            ]
        },
        {
            title: 'Discovery',
            items: [
                { id: 'news', label: 'Music News', icon: Newspaper, color: 'text-green-400' },
                { id: 'concerts', label: 'Concerts', icon: Ticket, color: 'text-pink-400' },
                { id: 'radio', label: 'Artist Radio', icon: Radio, color: 'text-orange-400' },
                { id: 'podcasts', label: 'Podcasts', icon: Mic, color: 'text-teal-400' },
            ]
        },
        {
            title: 'Fun & Social',
            items: [
                { id: 'trivia', label: 'Music Trivia', icon: Gamepad2, color: 'text-yellow-500' },
                { id: 'ar', label: 'AR Experience', icon: Sparkles, color: 'text-cyan-400' },
            ]
        }
    ];

    const renderFeatureView = () => {
        switch (activeFeature) {
            // Discovery
            case 'news': return <NewsView />;
            case 'concerts': return <ConcertView />;
            case 'radio': return <ArtistRadioView />;
            case 'podcasts': return <PodcastView />;

            // Audio
            case 'eq': return <EqualizerView />;
            case 'karaoke': return <KaraokeView />;
            case '3d': return <SpatialAudioView />;

            // Lifestyle
            case 'workout': return <WorkoutView />;
            case 'sleep': return <SleepTimerView />;
            case 'focus': return <FocusTimerView />;

            // Fun
            case 'trivia': return <TriviaView />;
            case 'ar': return <ARView />;

            default: return <div className="p-8 text-center text-white/50">Feature Coming Soon</div>;
        }
    };

    return (
        <MobileBottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={activeFeature ? (categories.flatMap(c => c.items).find(i => i.id === activeFeature)?.label ?? 'Feature Detail') : "Features Hub"}
        >
            <div className="min-h-[60vh] pb-8">
                <AnimatePresence mode="wait">
                    {activeFeature ? (
                        <motion.div
                            key="feature-view"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 50, opacity: 0 }}
                        >
                            <button
                                onClick={() => setActiveFeature(null)}
                                className="mb-4 text-sm text-white/60 hover:text-white flex items-center gap-1"
                            >
                                ← Back to Menu
                            </button>
                            {renderFeatureView()}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="menu-list"
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            className="space-y-6"
                        >
                            {categories.map((cat) => (
                                <div key={cat.title}>
                                    <h3 className="text-xs font-black uppercase text-white/40 mb-3 px-2 tracking-wider">
                                        {cat.title}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {cat.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveFeature(item.id)}
                                                className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 active:scale-95 transition-all text-center gap-3 group"
                                            >
                                                <div className={cn("p-3 rounded-full bg-black/40 group-hover:scale-110 transition-transform", item.color)}>
                                                    <item.icon className="w-6 h-6" />
                                                </div>
                                                <span className="text-sm font-bold text-white/90">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileBottomSheet>
    );
}

// --- SUB-VIEWS ---

function EqualizerView() {
    const { eqState, setPreset, presets } = useEqualizer(null);
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                {(Object.keys(presets) as Array<keyof typeof presets>).map(preset => (
                    <button
                        key={preset}
                        onClick={() => setPreset(preset)}
                        className={cn(
                            "p-3 rounded-xl text-sm font-bold transition-all",
                            eqState.activePreset === preset ? "bg-blue-500 text-white" : "bg-white/5 text-white/60"
                        )}
                    >
                        {presets[preset].name}
                    </button>
                ))}
            </div>
        </div>
    );
}

function KaraokeView() {
    const { state, enableKaraoke, setVocalReduction, setPitchShift } = useKaraokeMode(null);
    return (
        <div className="space-y-6 py-4">
            <button
                onClick={() => enableKaraoke(!state.enabled)}
                className={cn(
                    "w-full py-4 rounded-xl font-bold transition-colors",
                    state.enabled ? "bg-purple-500" : "bg-white/10"
                )}
            >
                {state.enabled ? "Karaoke Active" : "Enable Karaoke Mode"}
            </button>
            {state.enabled && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/60">VOCAL REDUCTION</label>
                        <input
                            type="range" min="0" max="1" step="0.1"
                            value={state.vocalReduction}
                            onChange={(e) => setVocalReduction(parseFloat(e.target.value))}
                            className="w-full accent-purple-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/60">PITCH ({state.pitchShift})</label>
                        <div className="flex gap-2">
                            <button onClick={() => setPitchShift(state.pitchShift - 1)} className="p-2 bg-white/10 rounded-lg flex-1">-</button>
                            <button onClick={() => setPitchShift(state.pitchShift + 1)} className="p-2 bg-white/10 rounded-lg flex-1">+</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SpatialAudioView() {
    const { settings, enable3D, rotateAround } = use3DAudio(null);
    return (
        <div className="space-y-6 py-4">
            <button
                onClick={() => enable3D(!settings.enabled)}
                className={cn(
                    "w-full py-4 rounded-xl font-bold transition-colors",
                    settings.enabled ? "bg-indigo-500" : "bg-white/10"
                )}
            >
                {settings.enabled ? "3D Audio Active" : "Enable 3D Audio"}
            </button>
            {settings.enabled && (
                <button
                    onClick={() => rotateAround(2)}
                    className="w-full py-3 bg-white/5 rounded-xl text-indigo-300 font-bold"
                >
                    Start Rotation Effect
                </button>
            )}
        </div>
    );
}

function FocusTimerView() {
    const { state, start, pause, reset, formatTime } = useStudyTimer();
    return (
        <div className="text-center py-8">
            <div className="text-xs font-bold text-yellow-500 mb-2 uppercase tracking-widest">{state.phase.replace('-', ' ')}</div>
            <div className="text-6xl font-black font-mono mb-8">
                {formatTime(state.remainingSeconds)}
            </div>
            <div className="flex justify-center gap-4">
                {!state.isActive ? (
                    <button onClick={start} className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                        <PlayCircle className="w-8 h-8 text-black" />
                    </button>
                ) : (
                    <button onClick={pause} className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                        <PauseCircle className="w-8 h-8" />
                    </button>
                )}
                <button onClick={reset} className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}

function ArtistRadioView() {
    const { currentStationArtist, startRadio, skipTrack, isPlaying } = useArtistRadio();
    return (
        <div className="space-y-4">
            {!isPlaying ? (
                <button
                    onClick={() => startRadio('mock-artist-id')}
                    className="w-full py-4 bg-orange-500 rounded-xl font-bold"
                >
                    Start "The Weeknd" Radio
                </button>
            ) : (
                <div className="p-4 bg-white/5 rounded-xl text-center">
                    <div className="w-32 h-32 bg-orange-500/20 rounded-full mx-auto mb-4 animate-pulse" />
                    <h3 className="font-bold text-lg mb-1">{currentStationArtist?.name ?? "Radio Station"}</h3>
                    <p className="text-white/60 text-sm mb-4">Playing similar tracks...</p>
                    <button onClick={skipTrack} className="px-6 py-2 bg-white/10 rounded-full font-bold text-sm">
                        Skip Track
                    </button>
                </div>
            )}
        </div>
    );
}

function PodcastView() {
    const { subscriptions, toggleSubscription } = usePodcastIntegration();
    return (
        <div className="space-y-4">
            {subscriptions.length === 0 ? (
                <button
                    onClick={() => toggleSubscription('podcast-1')}
                    className="w-full py-4 bg-teal-500 rounded-xl font-bold"
                >
                    Subscribe to "Tech Talk"
                </button>
            ) : (
                subscriptions.map(podId => (
                    <div key={podId} className="p-4 bg-white/5 rounded-xl flex justify-between items-center">
                        <span className="font-bold">Tech Talk Daily</span>
                        <span className="text-teal-400 text-xs font-bold">SUBSCRIBED</span>
                    </div>
                ))
            )}
        </div>
    );
}

function ARView() {
    const { tiltProps, glareProps, isARActive } = useARAlbumArt();
    return (
        <div className="text-center py-8">
            <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">3D Album Art</h3>
            <p className="text-white/60 text-sm mb-6 max-w-[200px] mx-auto">
                Premium 3D tilt effect for album artwork. Move your mouse or tilt your device!
            </p>

            {/* Demo Preview */}
            <div
                className="w-40 h-40 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl overflow-hidden relative"
                {...tiltProps}
            >
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🎵</div>
                <div {...glareProps} />
            </div>

            <p className="text-xs text-white/40 mt-4">
                {isARActive ? '✅ Effect Active' : 'Hover over the artwork above!'}
            </p>
        </div>
    );
}

// ... Existing views (News, Concerts, Trivia, Workout, Sleep) ...

function NewsView() {
    const { news, isLoading, refresh } = useMusicNews();

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-green-400 font-bold">LATEST UPDATES</span>
                <button onClick={refresh} className="text-xs text-white/60">Refresh</button>
            </div>

            {isLoading ? (
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}
                </div>
            ) : (
                news.map(item => (
                    <div key={item.id} className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <h4 className="font-bold text-white mb-1">{item.title}</h4>
                        <p className="text-sm text-white/60 mb-2">{item.summary}</p>
                        <div className="flex justify-between text-xs text-white/40">
                            <span>{item.source}</span>
                            <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

function ConcertView() {
    const { events, isLoading, fetchConcerts } = useConcertDiscovery();

    return (
        <div className="space-y-4">
            <button
                onClick={() => fetchConcerts(['mock'])}
                className="w-full py-3 bg-pink-500 rounded-xl font-bold mb-4"
            >
                Scan for Concerts
            </button>

            {isLoading ? (
                <div className="text-center py-8 text-white/40">Scanning location...</div>
            ) : events.length > 0 ? (
                events.map(event => (
                    <div key={event.id} className="flex gap-4 p-4 bg-white/5 rounded-xl items-center">
                        <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex flex-col items-center justify-center text-pink-400 font-bold leading-none">
                            <span className="text-xs">OCT</span>
                            <span className="text-lg">15</span>
                        </div>
                        <div>
                            <h4 className="font-bold">{event.artist}</h4>
                            <p className="text-sm text-white/60">{event.venue} • {event.city}</p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-12 text-white/40">
                    No concerts found near you
                </div>
            )}
        </div>
    );
}

function TriviaView() {
    const { isActive, score, currentQuestion, startGame, submitAnswer, timeLeft } = useMusicTrivia();

    if (!isActive) {
        return (
            <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 bg-yellow-500 rounded-full mx-auto flex items-center justify-center mb-4">
                    <Gamepad2 className="w-10 h-10 text-black" />
                </div>
                <div>
                    <h3 className="text-2xl font-black">Music Master</h3>
                    <p className="text-white/60">Test your knowledge!</p>
                </div>
                <button
                    onClick={startGame}
                    className="px-8 py-3 bg-white text-black font-bold rounded-full text-lg"
                >
                    Start Game
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-center">
            <div className="flex justify-between items-center text-sm font-mono">
                <span>Score: {score}</span>
                <span className="text-yellow-400">{timeLeft}s</span>
            </div>

            <div className="py-8">
                <h4 className="text-xl font-bold mb-8">Who performs this track?</h4>
                {/* Audio visualization placeholder */}
                <div className="h-16 flex items-center justify-center gap-1 mb-8">
                    {[...Array(10)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-1 bg-yellow-500 rounded-full"
                            animate={{ height: [10, 30, 10] }}
                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {currentQuestion?.options.map(opt => (
                        <button
                            key={opt}
                            onClick={() => submitAnswer(opt)}
                            className="p-4 bg-white/10 rounded-xl font-bold hover:bg-white/20"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function WorkoutView() {
    const { state, startWorkout, stopWorkout, formatTime, bpmRanges } = useWorkoutMode();

    if (!state.isActive) {
        return (
            <div className="grid grid-cols-2 gap-3">
                {Object.entries(bpmRanges).map(([key, range]) => (
                    <button
                        key={key}
                        onClick={() => startWorkout(key as any)}
                        className="p-4 bg-white/5 rounded-xl text-left hover:bg-red-500/20"
                    >
                        <h4 className="font-bold capitalize">{range.name}</h4>
                        <p className="text-xs text-white/50">{range.min}-{range.max} BPM</p>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="text-center py-8">
            <div className="text-6xl font-black font-mono mb-2">
                {formatTime(state.elapsed)}
            </div>
            <p className="text-red-400 font-bold mb-8 flex items-center justify-center gap-2">
                <Activity className="animate-pulse" />
                {state.currentBPM} BPM Target
            </p>

            <button
                onClick={stopWorkout}
                className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mx-auto"
            >
                <div className="w-8 h-8 bg-black rounded" />
            </button>
        </div>
    );
}

function SleepTimerView() {
    const { state, startTimer, cancelTimer, formatTime } = useSleepTimer(() => console.log('Timer ended'));

    return (
        <div className="text-center py-8">
            {state.isActive ? (
                <>
                    <div className="text-5xl font-black font-mono mb-8">
                        {Math.floor(state.remainingSeconds / 60)}:{(state.remainingSeconds % 60).toString().padStart(2, '0')}
                    </div>
                    <button
                        onClick={cancelTimer}
                        className="px-6 py-2 bg-white/10 rounded-full text-sm font-bold"
                    >
                        Cancel Timer
                    </button>
                </>
            ) : (
                <div className="space-y-3">
                    {[15, 30, 45, 60].map(mins => (
                        <button
                            key={mins}
                            onClick={() => startTimer(mins)}
                            className="w-full p-4 bg-white/5 rounded-xl font-bold hover:bg-indigo-500/20"
                        >
                            {mins} Minutes
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

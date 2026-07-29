'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Volume2, Headphones, Shuffle, SkipForward, Play, Pause,
    ListMusic, Clock, Wand2, Save, FolderOpen, Settings,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useRadio } from '@/lib/radio-station';
import { useSpotify } from '@/lib/spotify-sdk';
import { QueueItem } from '@/lib/types';

interface AdvancedDJControlsProps {
    queue: QueueItem[];
    onSkip: () => void;
    onUpdateQueue: (queue: QueueItem[]) => void;
}

export function AdvancedDJControls({ queue, onSkip, onUpdateQueue }: AdvancedDJControlsProps) {
    const { currentStation } = useRadio();
    const { player } = useSpotify();

    // Crossfade settings
    const [crossfadeDuration, setCrossfadeDuration] = useState(3); // seconds
    const [isAutoDJ, setIsAutoDJ] = useState(false);
    const [cueTrack, setCueTrack] = useState<QueueItem | null>(null);
    const [isCuePlaying, setIsCuePlaying] = useState(false);
    const [savedTemplates, setSavedTemplates] = useState<string[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);

    // Cue player volume
    const [cueVolume, setCueVolume] = useState(50);
    const [mainVolume, setMainVolume] = useState(80);

    // Load saved templates
    useEffect(() => {
        const templates = localStorage.getItem('dj-queue-templates');
        if (templates) {
            setSavedTemplates(JSON.parse(templates));
        }
    }, []);

    // Auto DJ mode
    useEffect(() => {
        if (!isAutoDJ) return;

        // When Auto DJ is enabled, automatically manage the queue
        const autoManage = setInterval(async () => {
            // Check if queue is running low
            if (queue.length < 3) {
                // Could trigger recommendation API here
                console.log('Auto DJ: Queue running low, would add recommendations');
            }
        }, 10000);

        return () => clearInterval(autoManage);
    }, [isAutoDJ, queue]);

    const handleCueTrack = (track: QueueItem) => {
        setCueTrack(track);
        // In a real implementation, this would create a separate audio context
        // for headphone cueing
    };

    const handleToggleCue = () => {
        setIsCuePlaying(!isCuePlaying);
    };

    const handleSaveTemplate = () => {
        const name = prompt('Template name:');
        if (!name) return;

        const template = {
            name,
            tracks: queue.map(q => q.track_uri),
            createdAt: Date.now()
        };

        const templates = JSON.parse(localStorage.getItem('dj-queue-templates') || '[]');
        templates.push(template);
        localStorage.setItem('dj-queue-templates', JSON.stringify(templates));
        setSavedTemplates(templates.map((t: { name: string }) => t.name));
    };

    const handleLoadTemplate = (templateName: string) => {
        const templates = JSON.parse(localStorage.getItem('dj-queue-templates') || '[]');
        const template = templates.find((t: { name: string }) => t.name === templateName);

        if (template) {
            // Would need to resolve track URIs to full track data
            console.log('Loading template:', template);
            setShowTemplates(false);
        }
    };

    const handleCrossfadeChange = (value: number) => {
        setCrossfadeDuration(value);
        // Store preference
        localStorage.setItem('dj-crossfade', value.toString());
    };

    return (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-primary" />
                    DJ Controls
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAutoDJ(!isAutoDJ)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isAutoDJ
                                ? 'bg-primary text-white'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                    >
                        <Wand2 className="w-4 h-4 inline mr-1" />
                        Auto DJ
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Volume Controls */}
                <div className="space-y-4">
                    <div className="p-3 bg-white/5 rounded-xl">
                        <label className="text-xs text-muted-foreground mb-2 block">
                            Main Volume
                        </label>
                        <div className="flex items-center gap-3">
                            <Volume2 className="w-4 h-4 text-white/60" />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={mainVolume}
                                onChange={(e) => setMainVolume(parseInt(e.target.value))}
                                className="flex-1 accent-primary"
                            />
                            <span className="text-xs text-white/60 w-8">{mainVolume}%</span>
                        </div>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl">
                        <label className="text-xs text-muted-foreground mb-2 block">
                            Cue Volume (Headphones)
                        </label>
                        <div className="flex items-center gap-3">
                            <Headphones className="w-4 h-4 text-white/60" />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={cueVolume}
                                onChange={(e) => setCueVolume(parseInt(e.target.value))}
                                className="flex-1 accent-purple-500"
                            />
                            <span className="text-xs text-white/60 w-8">{cueVolume}%</span>
                        </div>
                    </div>
                </div>

                {/* Crossfade & Transitions */}
                <div className="space-y-4">
                    <div className="p-3 bg-white/5 rounded-xl">
                        <label className="text-xs text-muted-foreground mb-2 block">
                            Crossfade Duration
                        </label>
                        <div className="flex items-center gap-3">
                            <ChevronLeft className="w-4 h-4 text-white/60" />
                            <input
                                type="range"
                                min="0"
                                max="12"
                                value={crossfadeDuration}
                                onChange={(e) => handleCrossfadeChange(parseInt(e.target.value))}
                                className="flex-1 accent-primary"
                            />
                            <span className="text-xs text-white/60 w-12">{crossfadeDuration}s</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveTemplate}
                            className="flex-1 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white/80 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save Queue
                        </button>
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="flex-1 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white/80 flex items-center justify-center gap-2 transition-colors"
                        >
                            <FolderOpen className="w-4 h-4" />
                            Templates
                        </button>
                    </div>
                </div>
            </div>

            {/* Cue Track Section */}
            <AnimatePresence>
                {cueTrack && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleToggleCue}
                                className="p-2 bg-purple-500 text-white rounded-lg"
                            >
                                {isCuePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {cueTrack.track_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {cueTrack.artist_name}
                                </p>
                            </div>
                            <span className="text-xs text-purple-400 px-2 py-1 bg-purple-500/20 rounded">
                                CUE
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Templates Popup */}
            <AnimatePresence>
                {showTemplates && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 p-3 bg-white/5 rounded-xl"
                    >
                        <h4 className="text-sm font-medium text-white mb-2">Saved Templates</h4>
                        {savedTemplates.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No templates saved yet</p>
                        ) : (
                            <div className="space-y-2">
                                {savedTemplates.map((name, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleLoadTemplate(name)}
                                        className="w-full p-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white text-left transition-colors"
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Next Up Preview */}
            {queue.length > 0 && (
                <div className="mt-4 p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Next Up</span>
                        <button
                            onClick={onSkip}
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                            <SkipForward className="w-3 h-3" />
                            Skip
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        {queue[0]?.album_art_url && (
                            <img
                                src={queue[0].album_art_url}
                                alt=""
                                className="w-10 h-10 rounded object-cover"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {queue[0]?.track_name || 'No tracks queued'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {queue[0]?.artist_name}
                            </p>
                        </div>
                        <button
                            onClick={() => queue[0] && handleCueTrack(queue[0])}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Cue in headphones"
                        >
                            <Headphones className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

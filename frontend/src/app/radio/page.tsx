'use client';

import { useState, useEffect } from 'react';
import { VinylBroadcast } from '@/components/vinyl-broadcast';
import { MobilePlayer } from '@/components/mobile-player';
import { DarkModePlayer } from '@/components/dark-mode-player';
import { MinimalAlbumPlayer } from '@/components/minimal-album-player';
import { ChevronDown, Monitor, Smartphone, Moon, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type PlayerView = 'desktop' | 'mobile' | 'darkmode' | 'minimal';

const viewOptions = [
    { id: 'desktop' as const, label: 'Desktop', icon: Monitor, description: 'Classic vinyl broadcast' },
    { id: 'mobile' as const, label: 'Mobile', icon: Smartphone, description: 'Touch-optimized player' },
    { id: 'darkmode' as const, label: 'Dark Mode', icon: Moon, description: 'Premium vinyl design' },
    { id: 'minimal' as const, label: 'Minimal', icon: Image, description: 'Album-focused experience' },
];

export default function RadioPage() {
    const [view, setView] = useState<PlayerView>('desktop');
    const [mounted, setMounted] = useState(false);
    const [showViewSelector, setShowViewSelector] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedView = localStorage.getItem('radio-player-view') as PlayerView;
        if (savedView === 'desktop' || savedView === 'mobile' || savedView === 'darkmode' || savedView === 'minimal') {
            setView(savedView);
        }
    }, []);

    const setViewAndSave = (newView: PlayerView) => {
        setView(newView);
        localStorage.setItem('radio-player-view', newView);
        setShowViewSelector(false);
    };

    const cycleView = () => {
        const views: PlayerView[] = ['desktop', 'mobile', 'darkmode', 'minimal'];
        const currentIndex = views.indexOf(view);
        const nextView = views[(currentIndex + 1) % views.length] as PlayerView;
        setViewAndSave(nextView);
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-pulse text-white/30 font-mono">LOADING...</div>
            </div>
        );
    }

    const currentViewOption = viewOptions.find(v => v.id === view);

    // Players that handle their own view toggle via the onToggleView prop
    if (view === 'mobile') {
        return <MobilePlayer stationId="lobby" onToggleView={cycleView} />;
    }

    if (view === 'darkmode') {
        return <DarkModePlayer stationId="lobby" onToggleView={cycleView} />;
    }

    if (view === 'minimal') {
        return <MinimalAlbumPlayer stationId="lobby" onToggleView={cycleView} />;
    }

    // Desktop view with theme selector
    return (
        <div className="relative">
            {/* Unified Theme Selector - Bottom Right */}
            <div className="fixed bottom-4 right-4 z-50">
                <div className="relative">
                    {/* Current View Button */}
                    <button
                        onClick={() => setShowViewSelector(!showViewSelector)}
                        className="px-5 py-3 rounded-xl bg-black/80 backdrop-blur-xl text-white font-semibold text-sm flex items-center gap-3 hover:bg-black/90 transition-all border border-white/10 shadow-2xl"
                    >
                        {currentViewOption && <currentViewOption.icon className="w-4 h-4" />}
                        <span>Theme: {currentViewOption?.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showViewSelector ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    <AnimatePresence>
                        {showViewSelector && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden min-w-[220px] shadow-2xl"
                            >
                                {viewOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setViewAndSave(option.id)}
                                        className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/10 transition-all ${view === option.id ? 'bg-white/10 text-white' : 'text-white/70'
                                            }`}
                                    >
                                        <option.icon className="w-4 h-4" />
                                        <div>
                                            <div className="font-semibold text-sm">{option.label}</div>
                                            <div className="text-xs text-white/40">{option.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <VinylBroadcast stationId="lobby" />
        </div>
    );
}

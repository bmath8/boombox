/**
 * Queue Settings Component
 * Controls for crossfade, auto-queue, and other playback settings
 */

'use client';

import React from 'react';
import { Settings, Radio, Zap } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface QueueSettingsProps {
    crossfadeDuration: number;
    onCrossfadeChange: (duration: number) => void;
    autoQueueEnabled: boolean;
    onAutoQueueChange: (enabled: boolean) => void;
    autoQueueSource: 'playlist' | 'recommendations';
    onAutoQueueSourceChange: (source: 'playlist' | 'recommendations') => void;
}

export function QueueSettings({
    crossfadeDuration,
    onCrossfadeChange,
    autoQueueEnabled,
    onAutoQueueChange,
    autoQueueSource,
    onAutoQueueSourceChange,
}: QueueSettingsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white"
                    aria-label="Queue Settings"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-black/90 border-white/10 backdrop-blur-xl text-white">
                <DropdownMenuLabel>Playback Settings</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />

                {/* Crossfade Control */}
                <div className="p-3 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span>Crossfade</span>
                        <span className="text-muted-foreground">{crossfadeDuration}s</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="12"
                        step="1"
                        value={crossfadeDuration}
                        onChange={(e) => onCrossfadeChange(Number(e.target.value))}
                        className="w-full accent-primary h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <DropdownMenuSeparator className="bg-white/10" />

                {/* Auto-Queue Toggle */}
                <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                            <Zap className="w-3 h-3 text-yellow-400" />
                            Auto-Queue
                        </span>
                        <button
                            onClick={() => onAutoQueueChange(!autoQueueEnabled)}
                            className={`w-8 h-4 rounded-full transition-colors relative ${autoQueueEnabled ? 'bg-primary' : 'bg-white/20'
                                }`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoQueueEnabled ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                        </button>
                    </div>

                    {autoQueueEnabled && (
                        <div className="space-y-1 mt-2">
                            <button
                                onClick={() => onAutoQueueSourceChange('playlist')}
                                className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 ${autoQueueSource === 'playlist' ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-muted-foreground'
                                    }`}
                            >
                                <Radio className="w-3 h-3" />
                                From Playlist
                            </button>
                            <button
                                onClick={() => onAutoQueueSourceChange('recommendations')}
                                className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 ${autoQueueSource === 'recommendations' ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-muted-foreground'
                                    }`}
                            >
                                <Zap className="w-3 h-3" />
                                From Recommendations
                            </button>
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

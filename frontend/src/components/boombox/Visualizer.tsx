"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface VisualizerProps {
    onAudioUpdate?: (left: number, right: number, bass: number) => void;
    className?: string;
}

const VIZ_MODES = [
    { id: 'hybrid', name: 'HYBRID SPECTRUM' },
    { id: 'mirror', name: 'MIRROR BARS' },
    { id: 'terrain', name: 'TERRAIN PEAKS' },
    { id: 'aurora', name: 'PARTICLE AURORA' },
    { id: 'smoke', name: 'SMOKE TRAIL' }
];

const BAR_COUNT = 32;

// Pre-generate animation delays and durations for each bar
const barConfigs = Array.from({ length: BAR_COUNT }, (_, i) => {
    const position = i / BAR_COUNT;
    // Bass bars (left side) are taller, treble (right side) are shorter
    const basePeak = 85 - position * 40; // 85% down to 45%
    const baseMin = 15 + position * 10;   // 15% up to 25%
    // Stagger animation timing for organic feel
    const delay = (i * 0.05) % 0.5;
    const duration = 0.4 + Math.random() * 0.3; // 0.4s to 0.7s

    return { basePeak, baseMin, delay, duration };
});

// Color based on bar position
function getBarColor(index: number): string {
    const position = index / BAR_COUNT;
    if (position < 0.25) return '#ef4444'; // Red for bass
    if (position < 0.4) return '#f97316';  // Orange
    if (position < 0.6) return '#fbbf24';  // Yellow
    if (position < 0.8) return '#84cc16';  // Lime
    return '#22c55e'; // Green for high
}

export function Visualizer({ onAudioUpdate, className }: VisualizerProps) {
    const [vizIndex, setVizIndex] = useState(0);

    return (
        <div className={cn("flex flex-col gap-[10px]", className)}>
            <div className="bg-[#040406] rounded-[8px] border-[2px] border-[#1a1a1f] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                {/* Visualizer bars container */}
                <div className="relative h-[90px] flex items-end justify-center gap-[2px] px-2 py-2">
                    {/* Scanline overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.2)_0px,rgba(0,0,0,0.2)_1px,transparent_1px,transparent_3px)] z-10" />

                    {/* CSS Animated bars */}
                    {barConfigs.map((config, i) => {
                        const color = getBarColor(i);
                        return (
                            <div
                                key={i}
                                className="flex-1 rounded-t-[2px] min-w-[4px] visualizer-bar"
                                style={{
                                    background: `linear-gradient(to top, ${color}ee, ${color}88)`,
                                    boxShadow: `0 0 8px ${color}60`,
                                    animationDelay: `${config.delay}s`,
                                    animationDuration: `${config.duration}s`,
                                    // Use CSS custom properties for min/max heights
                                    ['--bar-min' as string]: `${config.baseMin}%`,
                                    ['--bar-max' as string]: `${config.basePeak}%`,
                                }}
                            />
                        );
                    })}
                </div>

                {/* Status bar */}
                <div className="flex justify-between items-center px-[12px] py-[5px] bg-[rgba(0,0,0,0.4)] border-t border-[#151518]">
                    <span className="font-[family-name:var(--font-share)] text-[8px] text-[#444] tracking-[1px]">48kHz • STEREO</span>
                    <span className="font-[family-name:var(--font-share)] text-[8px] tracking-[1px] flex items-center gap-[4px] text-[#22c55e]">
                        <span className="w-[4px] h-[4px] bg-[#22c55e] rounded-full animate-pulse" />
                        STREAMING
                    </span>
                </div>
            </div>

            {/* Mode selector */}
            <div className="flex items-center justify-center gap-[10px] p-[6px] bg-[rgba(0,0,0,0.3)] rounded-[4px]">
                <button
                    onClick={() => setVizIndex(prev => (prev - 1 + VIZ_MODES.length) % VIZ_MODES.length)}
                    aria-label="Previous Visualizer Mode"
                    className="w-[24px] h-[24px] flex items-center justify-center bg-gradient-to-b from-[#1a1a1f] to-[#141418] border border-[#2a2a32] rounded-[4px] text-[#555] text-[12px] hover:border-[var(--orange)] hover:text-[var(--orange)] hover:shadow-[0_0_10px_var(--orange-glow)] transition-all duration-200"
                >
                    <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="font-[family-name:var(--font-orbitron)] text-[8px] text-[var(--orange)] tracking-[1px] min-w-[110px] text-center" aria-live="polite">
                    {VIZ_MODES[vizIndex]?.name || "VISUALIZER"}
                </span>
                <div className="flex gap-[5px]" role="radiogroup" aria-label="Visualizer Modes">
                    {VIZ_MODES.map((mode, i) => (
                        <button
                            key={mode.id}
                            role="radio"
                            aria-checked={vizIndex === i}
                            aria-label={mode.name}
                            onClick={() => setVizIndex(i)}
                            className={cn(
                                "w-[7px] h-[7px] bg-[#222] border border-[#333] rounded-full cursor-pointer transition-all duration-200 hover:bg-[rgba(255,107,0,0.3)] p-0",
                                vizIndex === i && "bg-[var(--orange)] shadow-[0_0_8px_var(--orange-glow)]"
                            )}
                        />
                    ))}
                </div>
                <button
                    onClick={() => setVizIndex(prev => (prev + 1) % VIZ_MODES.length)}
                    aria-label="Next Visualizer Mode"
                    className="w-[24px] h-[24px] flex items-center justify-center bg-gradient-to-b from-[#1a1a1f] to-[#141418] border border-[#2a2a32] rounded-[4px] text-[#555] text-[12px] hover:border-[var(--orange)] hover:text-[var(--orange)] hover:shadow-[0_0_10px_var(--orange-glow)] transition-all duration-200"
                >
                    <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

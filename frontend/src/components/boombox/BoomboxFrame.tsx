"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";
import { Speaker } from "./Speaker";
import { Visualizer } from "./Visualizer";
import { VUMeter } from "./VUMeter";
import { CassetteDeck } from "./CassetteDeck";
import { TheBooth } from "./TheBooth";

interface BoomboxFrameProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onSpotifyLogin: () => void;
    onDemoLogin?: () => void;
    isLoading?: boolean;
}

export function BoomboxFrame({ onLogin, onSpotifyLogin, onDemoLogin, isLoading }: BoomboxFrameProps) {
    const [vuLeft, setVuLeft] = useState(0);
    const [vuRight, setVuRight] = useState(0);
    const [bassLevel, setBassLevel] = useState(0);
    const [audioData, setAudioData] = useState<number[]>(new Array(12).fill(0));
    const [isBoothOpen, setIsBoothOpen] = useState(false);

    const handleAudioUpdate = useCallback((left: number, right: number, bass: number) => {
        setVuLeft(left);
        setVuRight(right);
        setBassLevel(bass);

        // Simulate EQ bands based on bass/volume (simplified)
        const newAudio = new Array(12).fill(0).map(() => Math.random() * (bass + 0.2));
        setAudioData(newAudio);
    }, []);

    return (
        <div className="relative pt-[35px] w-full max-w-[1500px] mx-auto p-4 md:p-8">

            {/* Carrying Handle - CSS REBUILD - Hidden on mobile to save space/layout */}
            <div className="hidden md:flex absolute top-[-25px] left-1/2 -translate-x-1/2 z-0 w-[420px] h-[60px] items-end justify-between px-4">
                {/* Left Mount */}
                <div className="w-[40px] h-[50px] bg-gradient-to-b from-[#2a2a30] to-[#111] rounded-t-[8px] border-x border-t border-[#333] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20px] h-[20px] rounded-full bg-[#080808] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]" />
                </div>

                {/* The Handle Bar */}
                <div className="absolute top-[10px] left-[30px] right-[30px] h-[18px] bg-gradient-to-b from-[#666] via-[#eee] to-[#333] rounded-full z-0 shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
                    {/* Texture/Grip Lines */}
                    <div className="absolute inset-x-[40px] top-[4px] bottom-[4px] flex justify-between opacity-30">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="w-[2px] h-full bg-[#222]" />
                        ))}
                    </div>
                </div>

                {/* Right Mount */}
                <div className="w-[40px] h-[50px] bg-gradient-to-b from-[#2a2a30] to-[#111] rounded-t-[8px] border-x border-t border-[#333] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20px] h-[20px] rounded-full bg-[#080808] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]" />
                </div>
            </div>

            {/* Main Boombox Body */}
            <div className="relative w-full bg-gradient-to-b from-[#1a1a1f] via-[#111114] to-[#0a0a0d] rounded-[16px] border-[3px] border-[#252530] shadow-[0_50px_100px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.02),inset_0_1px_0_rgba(255,255,255,0.04),0_0_60px_rgba(255,107,0,0.05)] overflow-hidden flex flex-col">

                {/* Top Bar */}
                <div className="flex items-center justify-between px-[25px] py-[12px] bg-gradient-to-b from-[#1e1e24] to-[#18181c] border-b-[2px] border-[var(--border-boombox)]">
                    {/* Empty Left Side for Balance or Future Controls */}
                    <div className="w-[100px]" />

                    <div className="font-[family-name:var(--font-orbitron)] text-[clamp(26px,4vw,38px)] font-black tracking-[8px] bg-gradient-to-r from-[#ff6b6b] via-[#ffd93d] to-[#6bcb77] bg-clip-text text-transparent text-shadow-[0_0_30px_var(--orange-glow),0_0_60px_rgba(255,107,0,0.3)] text-center drop-shadow-[0_0_20px_rgba(255,107,0,0.5)]">
                        BOOMBOX
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center justify-end gap-[15px] w-[100px]">
                        <button
                            onClick={() => setIsBoothOpen(true)}
                            className="flex items-center gap-[6px] group cursor-pointer"
                            aria-label="Open The Booth"
                        >
                            <Mic className="w-4 h-4 text-zinc-500 group-hover:text-[var(--orange)] transition-colors" />
                            <span className="font-[family-name:var(--font-share)] text-[8px] text-[#444] group-hover:text-[var(--orange)] tracking-[1px] transition-colors">MIC</span>
                        </button>

                        <div className="flex items-center gap-[6px]">
                            <div className="w-[8px] h-[8px] bg-[radial-gradient(circle_at_30%_30%,#ff8800,#cc4400)] rounded-full border-[2px] border-[#222] shadow-[0_0_12px_var(--orange-glow)] animate-[led-pulse_1.5s_infinite]" />
                            <span className="font-[family-name:var(--font-share)] text-[8px] text-[var(--orange)] tracking-[1px]">POWER</span>
                        </div>
                    </div>
                </div>

                {/* Main 3-Column Grid - Adjusted for better mobile fit */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,500px)_1fr] gap-0 min-h-[500px]">

                    {/* Left Speaker Zone - Full Panel */}
                    <div className="hidden lg:block relative h-full">
                        <Speaker bassLevel={bassLevel} />
                    </div>

                    {/* Center Stack: Visualizer & Deck */}
                    <div className="flex flex-col gap-6 items-center justify-center p-6 bg-[#0e0e11] border-x border-[#222]">

                        {/* Visualizer Display - "Holographic" Screen */}
                        <div className="w-full h-32 bg-black rounded-[8px] border-[2px] border-[#333] relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none z-20 opacity-20" />
                            <Visualizer onAudioUpdate={handleAudioUpdate} />
                        </div>

                        {/* Cassette Deck Auth */}
                        <CassetteDeck
                            onLogin={onLogin}
                            onSpotifyLogin={onSpotifyLogin}
                            isLoading={isLoading || false}
                        />

                        {/* Demo Entry - only shown when a demo handler is wired up */}
                        {onDemoLogin && (
                            <button
                                type="button"
                                onClick={onDemoLogin}
                                disabled={isLoading}
                                className="flex items-center gap-[6px] group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="font-[family-name:var(--font-share)] text-[9px] text-[#555] group-hover:text-[var(--orange)] tracking-[1px] transition-colors">
                                    ▶ ENTER DEMO — NO ACCOUNT NEEDED
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Right Speaker Zone - Full Panel */}
                    <div className="hidden lg:block relative h-full">
                        <Speaker bassLevel={bassLevel} />
                    </div>

                    {/* Mobile Speaker (Visible only on small screens) */}
                    <div className="lg:hidden flex justify-center p-4">
                        <Speaker bassLevel={bassLevel} />
                    </div>
                </div>

                {/* Bottom Strip */}
                <div className="flex items-center justify-center gap-[25px] px-[25px] py-[10px] bg-gradient-to-b from-[#0e0e11] to-[#111114] border-t-[2px] border-[var(--border-boombox)]">
                    <EQSection bands={audioData} />
                    <Vents />
                    <EQSection bands={audioData} />
                </div>

            </div>

            <TheBooth isOpen={isBoothOpen} onClose={() => setIsBoothOpen(false)} />
        </div>
    );
}

// Sub-components for Bottom Strip
function EQSection({ bands }: { bands: number[] }) {
    return (
        <div className="flex gap-[4px] items-end h-[28px]">
            {bands.map((val, i) => (
                <div key={i} className="w-[6px] h-full bg-[#080808] rounded-[3px] border border-[#1a1a1f] relative overflow-hidden">
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--orange)] to-[#ffaa00] rounded-[2px] transition-[height] duration-100 ease-out"
                        style={{ height: `${(0.2 + val * 0.8) * 100}%` }}
                    />
                </div>
            ))}
        </div>
    );
}

function Vents() {
    return (
        <div className="flex gap-[5px]">
            {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="w-[22px] h-[3px] bg-[#060608] rounded-[1px] border border-[#1a1a1f]" />
            ))}
        </div>
    );
}

"use client";

import { cn } from "@/lib/utils";

interface SpeakerProps {
    bassLevel?: number; // Kept for API compatibility but animation is CSS-based now
}

export function Speaker({ bassLevel = 0 }: SpeakerProps) {
    return (
        <div className="w-full h-full bg-[#111] relative overflow-hidden flex items-center justify-center p-8 group">
            {/* 1. Cabinet Mesh Texture Background */}
            <div className="absolute inset-0 z-0">
                {/* Dark base */}
                <div className="absolute inset-0 bg-[#080808]" />
                {/* Mesh pattern */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#333_1px,transparent_1px)] bg-[length:4px_4px]" />
                {/* Vignette for depth */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]" />
            </div>

            {/* 2. Main Driver Container */}
            <div className="relative z-10 w-full max-w-[320px] aspect-square flex items-center justify-center">

                {/* Outer Glow Ring (The "Halo") - pulsing animation */}
                <div className="absolute inset-0 rounded-full border-[3px] border-[var(--orange)] opacity-80 blur-[2px] speaker-pulse" />
                <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(255,107,0,0.4)] speaker-pulse" />

                {/* 3. The Surround (Rubber edge) */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#222] to-[#111] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_4px_8px_rgba(0,0,0,0.5)] border border-[#333]" />

                {/* 4. The Cone (Moving Part) - pulsing animation */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#050505] shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] flex items-center justify-center speaker-cone-pulse">
                    {/* Cone Texture/Sheen */}
                    <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0%,rgba(255,255,255,0.03)_25%,transparent_50%,rgba(255,255,255,0.03)_75%,transparent_100%)]" />

                    {/* Inner Ridge Highlight */}
                    <div className="absolute inset-[15%] rounded-full border border-white/5 opacity-50" />

                    {/* 5. Dust Cap (Center Dome) */}
                    <div className="relative w-[35%] h-[35%] rounded-full bg-gradient-to-br from-[#222] to-[#000] shadow-[0_5px_15px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.2)]">
                        {/* Specular Highlight on Dome */}
                        <div className="absolute top-[20%] left-[20%] w-[30%] h-[20%] bg-white blur-[4px] opacity-10 rounded-full rotate-[-45deg]" />
                    </div>
                </div>

                {/* Orange Ring Highlight (Thin sharp line) - pulsing animation */}
                <div className="absolute inset-0 rounded-full border border-[var(--orange)] opacity-60 pointer-events-none mix-blend-screen speaker-pulse" />
            </div>

            {/* Screws */}
            <div className="absolute top-6 left-6 w-3 h-3 bg-[#111] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center"><div className="w-full h-[1px] bg-[#333] rotate-45" /></div>
            <div className="absolute top-6 right-6 w-3 h-3 bg-[#111] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center"><div className="w-full h-[1px] bg-[#333] rotate-45" /></div>
            <div className="absolute bottom-6 left-6 w-3 h-3 bg-[#111] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center"><div className="w-full h-[1px] bg-[#333] rotate-45" /></div>
            <div className="absolute bottom-6 right-6 w-3 h-3 bg-[#111] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center"><div className="w-full h-[1px] bg-[#333] rotate-45" /></div>
        </div>
    );
}


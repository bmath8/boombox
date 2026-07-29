"use client";

import { motion } from "framer-motion";

interface StraightTonearmProps {
    isPaused: boolean;
    themeColor: string;
}

export function StraightTonearm({ isPaused, themeColor }: StraightTonearmProps) {
    return (
        <div className="absolute top-[30px] left-[-30px] w-[200px] h-[200px] pointer-events-none z-20">

            {/* STATIC BASE (Does not rotate) */}
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full flex items-center justify-center z-10">
                {/* Brushed Metal Base */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#333] via-[#111] to-[#000] shadow-[0_5px_10px_rgba(0,0,0,0.8)] border border-[#333]" />
                <div className="absolute inset-[14px] rounded-full border border-[#444] bg-[#1a1a1a]" />
                {/* Center Bearing Cap */}
                <div className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-[#555] to-[#222] shadow-lg border border-[#444] z-20" />
            </div>

            {/* ROTATING ARM ASSEMBLY */}
            <motion.div
                className="absolute top-10 right-10 w-full h-full origin-[calc(100%-10px)_10px]"
                initial={{ rotate: 35 }}
                animate={{ rotate: isPaused ? 35 : 15 }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                style={{ transformOrigin: "90% 10%" }} // Approximate pivot point matching the visual base
            >

                {/* COUNTERWEIGHT (Rear) */}
                <div className="absolute top-[-15px] right-[-25px] w-[50px] h-[24px] bg-gradient-to-r from-[#222] via-[#444] to-[#222] rounded-sm shadow-md border border-[#333] transform rotate-[-5deg]">
                    <div className="absolute top-0 bottom-0 left-[10px] w-[2px] bg-black/50" />
                </div>

                {/* MAIN STRAIGHT TUBE */}
                <div className="absolute top-[8px] right-[20px] w-[180px] h-[8px] bg-gradient-to-b from-[#888] via-[#ccc] to-[#666] shadow-lg rounded-full origin-right transform rotate-[-5deg]">
                    {/* Tube highlight */}
                    <div className="absolute top-[2px] left-0 right-0 h-[2px] bg-white/40 rounded-full" />
                </div>

                {/* HEADSHELL (Front) */}
                <div className="absolute top-[25px] left-[-10px] w-[50px] h-[22px] bg-[#1a1a1a] rounded-[2px] shadow-xl border border-[#333] transform rotate-[15deg] origin-top-right z-30">

                    {/* Finger Lift */}
                    <div className="absolute -right-2 top-[-5px] w-6 h-[2px] bg-[#888] rotate-[-15deg] rounded-full" />

                    {/* Cartridge */}
                    <div className="absolute bottom-[-12px] left-[5px] w-[30px] h-[14px] bg-[#111] rounded-[2px] border border-[#333]">

                        {/* Screws */}
                        <div className="absolute top-0 left-1 w-1.5 h-1.5 rounded-full bg-[#444]" />
                        <div className="absolute top-0 right-1 w-1.5 h-1.5 rounded-full bg-[#444]" />

                        {/* Stylus Tip */}
                        <motion.div
                            className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-[2px] h-[6px] bg-white rounded-full"
                            animate={{
                                boxShadow: isPaused ? 'none' : `0 0 8px ${themeColor}, 0 0 4px white`
                            }}
                        />
                    </div>
                </div>

            </motion.div>
        </div>
    );
}

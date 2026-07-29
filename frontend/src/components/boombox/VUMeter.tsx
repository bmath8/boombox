"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface VUMeterProps {
    label: string;
    value: number; // 0 to 1
    className?: string;
    id?: string;
}

export function VUMeter({ label, value, className, id }: VUMeterProps) {
    const needleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (needleRef.current) {
            // Map 0-1 to -35deg to +35deg
            const angle = -35 + value * 70;
            needleRef.current.style.transform = `rotate(${angle}deg)`;
        }
    }, [value]);

    return (
        <div className={cn(
            "relative w-[85px] h-[42px] rounded-[4px] border-2 border-[#1a1a1f] overflow-hidden",
            "bg-gradient-to-b from-[#080808] to-[#040406]",
            "shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]",
            className
        )}>
            <span className="absolute top-[3px] left-1/2 -translate-x-1/2 font-[family-name:var(--font-share)] text-[6px] text-[#444] tracking-[1px]">
                {label}
            </span>

            {/* Needle */}
            <div
                ref={needleRef}
                id={id}
                className="absolute bottom-[4px] left-[10px] w-[2px] h-[26px] origin-bottom transition-transform duration-[80ms] ease-out rounded-[1px] shadow-[0_0_6px_var(--orange-glow)]"
                style={{
                    background: "linear-gradient(to top, #cc3300, #ff8800)",
                    transform: "rotate(-35deg)"
                }}
            >
                <div className="absolute -bottom-[2px] -left-[2px] w-[6px] h-[6px] bg-[#1a1a1f] rounded-full border border-[#333]" />
            </div>
        </div>
    );
}

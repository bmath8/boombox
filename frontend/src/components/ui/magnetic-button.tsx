"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { useRef, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "outline";
    className?: string;
}

export function MagneticButton({
    children,
    variant = "primary",
    className,
    ...props
}: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

    function handleMouseMove(e: MouseEvent<HTMLButtonElement>) {
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current!.getBoundingClientRect();

        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);

        x.set(middleX * 0.15);
        y.set(middleY * 0.15);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(139,92,246,0.3)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
    };

    return (
        <motion.button
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: mouseX, y: mouseY }}
            className={cn(
                "relative rounded-full px-8 py-4 font-mono text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                className
            )}
            {...props as any}
        >
            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </motion.button>
    );
}

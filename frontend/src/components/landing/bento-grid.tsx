"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { Radio, Users, Music2, Mic2, BarChart3, Globe } from "lucide-react";

const features = [
    {
        title: "Live Radio Stations",
        description: "Broadcast your taste to the world. Create your own station and build a following.",
        icon: Radio,
        className: "md:col-span-2 md:row-span-2",
    },
    {
        title: "Social Discovery",
        description: "Find new music through people, not algorithms.",
        icon: Users,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "Collaborative Playlists",
        description: "Build the perfect vibe together in real-time.",
        icon: Music2,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "DJ Mode",
        description: "Take control of the queue and host live shows.",
        icon: Mic2,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "Deep Analytics",
        description: "Track your listener stats and growth.",
        icon: BarChart3,
        className: "md:col-span-2 md:row-span-1",
    },
];

function FeatureCard({ feature, className }: { feature: typeof features[0], className?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            className={cn(
                "group relative border border-white/10 bg-white/5 overflow-hidden rounded-3xl p-8 hover:border-white/20 transition-colors",
                className
            )}
            onMouseMove={handleMouseMove}
            whileHover={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(139, 92, 246, 0.15),
              transparent 80%
            )
          `,
                }}
            />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="mb-2 font-sans text-xl font-bold text-foreground">{feature.title}</h3>
                    <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

export function BentoGrid() {
    return (
        <section className="py-24 px-4 md:px-6 relative z-10">
            <div className="container mx-auto">
                <div className="mb-16 text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold font-sans mb-4">
                        Everything you need to <span className="text-gradient-primary">go live.</span>
                    </h2>
                    <p className="text-muted-foreground font-mono">
                        Powerful tools for creators, curators, and listeners.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[250px]">
                    {features.map((feature, i) => (
                        <FeatureCard
                            key={i}
                            feature={feature}
                            className={feature.className}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

'use client';

import React, { useEffect } from 'react';
import { useGraffitiStore } from '@/lib/stores/useGraffitiStore';
import { AnimatePresence, motion } from 'framer-motion';

// Temporary demo shout-outs
const DEMO_SHOUTS = [
    "YO THIS TRACK SLAPS!",
    "NYC listing in 🗽",
    "FAM RADIO 4 LIFE",
    "Play some 90s!!",
    "Vibe check ✅",
    "Where my nocturnal crew at??",
    "BASS DROP PLS",
    "Sending love from Tokyo 🇯🇵",
];

export const RadioGraffiti = () => {
    const { tags, addTag } = useGraffitiStore();

    const [mounted, setMounted] = React.useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // DEMO: Auto-add random tags every few seconds
    useEffect(() => {
        if (!mounted) return;
        const interval = setInterval(() => {
            if (Math.random() > 0.6) { // 40% chance per tick
                const randomText = DEMO_SHOUTS[Math.floor(Math.random() * DEMO_SHOUTS.length)] || "Music!";
                addTag(randomText);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [addTag, mounted]);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            <AnimatePresence>
                {tags.map((tag) => (
                    <motion.div
                        key={tag.id}
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.5, filter: 'blur(4px)' }}
                        transition={{ duration: 0.4 }}
                        style={{
                            position: 'absolute',
                            left: `${tag.x}%`,
                            top: `${tag.y}%`,
                            transform: `translate(-50%, -50%) rotate(${tag.rotation}deg)`,
                            color: tag.color,
                            textShadow: `0 0 10px ${tag.color}, 2px 2px 0px black`,
                            fontFamily: 'var(--font-display)', // Assuming we have a display font, or fallback
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {tag.text}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

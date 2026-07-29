'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface AnimatedAlbumArtProps {
    src: string;
    alt: string;
    isPlaying: boolean;
    variant?: 'rotate' | 'pulse' | 'wave' | 'glitch';
    className?: string;
}

/**
 * Animated Album Art Component
 * 
 * Provides visual effects for album art during playback
 */
export function AnimatedAlbumArt({
    src,
    alt,
    isPlaying,
    variant = 'rotate',
    className,
}: AnimatedAlbumArtProps) {

    // Rotation variant (Vinyl style)
    if (variant === 'rotate') {
        return (
            <motion.div
                className={cn('relative rounded-full overflow-hidden aspect-square border-4 border-black/10', className)}
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear',
                    type: 'tween'
                }}
                style={{ originX: 0.5, originY: 0.5 }}
            >
                <img src={src} alt={alt} className="w-full h-full object-cover" />
                {/* Center hole for vinyl look */}
                <div className="absolute inset-0 m-auto w-4 h-4 bg-black rounded-full text-white" />
            </motion.div>
        );
    }

    // Pulse variant (Beat style)
    if (variant === 'pulse') {
        return (
            <motion.div
                className={cn('relative rounded-lg overflow-hidden aspect-square', className)}
                animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
                transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            >
                <img src={src} alt={alt} className="w-full h-full object-cover" />
            </motion.div>
        );
    }

    // Default static (fallback)
    return (
        <div className={cn('relative rounded-lg overflow-hidden aspect-square', className)}>
            <img src={src} alt={alt} className="w-full h-full object-cover" />
        </div>
    );
}

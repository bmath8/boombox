'use client';

import { useCallback, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

interface DoubleTapToLikeProps {
    onLike: () => void;
    isLiked: boolean;
    children: React.ReactNode;
    disabled?: boolean;
}

/**
 * Double-tap Album Art to Like Component
 * 
 * Detects double-tap gesture and triggers like action
 * Shows animated heart on double-tap
 * 
 * @example
 * ```tsx
 * <DoubleTapToLike onLike={handleLike} isLiked={isLiked}>
 *   <img src={albumArt} alt="Album" />
 * </DoubleTapToLike>
 * ```
 */
export function DoubleTapToLike({
    onLike,
    isLiked,
    children,
    disabled = false
}: DoubleTapToLikeProps) {
    const lastTapRef = useRef<number>(0);
    const heartControls = useAnimation();
    const DOUBLE_TAP_DELAY = 300; // ms

    const handleTap = useCallback(async () => {
        if (disabled) return;

        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;

        if (timeSinceLastTap < DOUBLE_TAP_DELAY && timeSinceLastTap > 0) {
            // Double tap detected!
            onLike();

            // Animate heart
            await heartControls.start({
                scale: [0, 1.2, 1],
                opacity: [0, 1, 1, 0],
                y: [0, -30, -60],
                transition: {
                    duration: 1,
                    times: [0, 0.3, 0.6, 1],
                    ease: 'easeOut',
                },
            });

            // Reset for next double-tap
            lastTapRef.current = 0;
        } else {
            lastTapRef.current = now;
        }
    }, [disabled, onLike, heartControls]);

    useEffect(() => {
        // Reset tap tracking if component unmounts or disabled changes
        return () => {
            lastTapRef.current = 0;
        };
    }, [disabled]);

    return (
        <div
            className="relative cursor-pointer select-none"
            onClick={handleTap}
            onTouchEnd={(e) => {
                e.preventDefault(); // Prevent zoom on double-tap
                handleTap();
            }}
        >
            {children}

            {/* Animated Heart Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <motion.div
                    animate={heartControls}
                    initial={{ scale: 0, opacity: 0 }}
                    className="flex items-center justify-center"
                >
                    <Heart
                        className="w-20 h-20"
                        fill={isLiked ? '#ef4444' : 'white'}
                        color={isLiked ? '#ef4444' : 'white'}
                        strokeWidth={2}
                    />
                </motion.div>
            </div>

            {/* Persistent like indicator */}
            {isLiked && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2"
                >
                    <Heart
                        className="w-5 h-5"
                        fill="#ef4444"
                        color="#ef4444"
                    />
                </motion.div>
            )}
        </div>
    );
}

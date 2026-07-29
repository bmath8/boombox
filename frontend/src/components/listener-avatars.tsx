'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Listener {
    id: string;
    name: string;
    avatar?: string;
    isActive: boolean;
    joinedAt: number;
}

interface ListenerAvatarsProps {
    listeners: Listener[];
    maxVisible?: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Live Listener Avatars Component
 * 
 * Shows active listeners with stacked avatars
 * Animates when listeners join/leave
 * 
 * @example
 * ```tsx
 * <ListenerAvatars 
 *   listeners={activeListeners}
 *   maxVisible={5}
 *   size="md"
 * />
 * ```
 */
export function ListenerAvatars({
    listeners,
    maxVisible = 5,
    size = 'md',
    className
}: ListenerAvatarsProps) {
    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-10 h-10 text-base',
    };

    const activeListeners = listeners
        .filter(l => l.isActive)
        .sort((a, b) => b.joinedAt - a.joinedAt);

    const visibleListeners = activeListeners.slice(0, maxVisible);
    const hiddenCount = Math.max(0, activeListeners.length - maxVisible);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getColorFromName = (name: string) => {
        // Generate consistent color from name
        const colors = [
            'bg-blue-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-red-500',
            'bg-orange-500',
            'bg-yellow-500',
            'bg-green-500',
            'bg-teal-500',
            'bg-cyan-500',
            'bg-indigo-500',
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <div className={cn('flex items-center', className)}>
            {/* Stacked Avatars */}
            <div className="flex -space-x-2">
                <AnimatePresence mode="popLayout">
                    {visibleListeners.map((listener, index) => (
                        <motion.div
                            key={listener.id}
                            initial={{ scale: 0, x: -20 }}
                            animate={{ scale: 1, x: 0 }}
                            exit={{ scale: 0, x: 20 }}
                            transition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 30,
                                delay: index * 0.05
                            }}
                            className={cn(
                                'relative rounded-full border-2 border-black overflow-hidden',
                                sizeClasses[size]
                            )}
                            style={{ zIndex: visibleListeners.length - index }}
                        >
                            {listener.avatar ? (
                                <img
                                    src={listener.avatar}
                                    alt={listener.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className={cn(
                                    'w-full h-full flex items-center justify-center font-bold text-white',
                                    getColorFromName(listener.name)
                                )}>
                                    {getInitials(listener.name)}
                                </div>
                            )}

                            {/* Active indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-black" />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Overflow count */}
                {hiddenCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                            'flex items-center justify-center rounded-full bg-white/10 border-2 border-black font-bold text-white/80',
                            sizeClasses[size]
                        )}
                    >
                        +{hiddenCount}
                    </motion.div>
                )}
            </div>

            {/* Listener count text */}
            {activeListeners.length > 0 && (
                <div className="ml-3 text-sm text-white/60">
                    {activeListeners.length} {activeListeners.length === 1 ? 'listener' : 'listeners'}
                </div>
            )}
        </div>
    );
}

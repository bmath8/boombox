'use client';

import { motion, useMotionValue, PanInfo, AnimatePresence } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MobileBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    snapPoints?: number[]; // Array of snap positions (0-1, where 1 is fully open)
    className?: string;
}

/**
 * Mobile Bottom Sheet Component
 * 
 * Native-feeling bottom sheet for mobile with snap points and drag gestures
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <MobileBottomSheet
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Options"
 *   snapPoints={[0.4, 0.9]}
 * >
 *   <div>Sheet content</div>
 * </MobileBottomSheet>
 * ```
 */
export function MobileBottomSheet({
    isOpen,
    onClose,
    children,
    title,
    snapPoints = [0.5, 0.9],
    className = '',
}: MobileBottomSheetProps) {
    const [snapIndex, setSnapIndex] = useState(snapPoints.length - 1); // Start at highest snap point
    const y = useMotionValue(0);

    // Reset snap index when sheet opens
    useEffect(() => {
        if (isOpen) {
            setSnapIndex(snapPoints.length - 1);
        }
    }, [isOpen, snapPoints.length]);

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const velocity = info.velocity.y;
        const offset = info.offset.y;

        // Fast downward swipe - close
        if (velocity > 500 || offset > window.innerHeight * 0.3) {
            onClose();
            return;
        }

        // Fast upward swipe - go to highest snap point
        if (velocity < -500) {
            setSnapIndex(snapPoints.length - 1);
            return;
        }

        // Find nearest snap point
        const currentSnapValue = snapPoints[snapIndex];
        if (currentSnapValue === undefined) return;

        const currentHeight = window.innerHeight * currentSnapValue;
        const newHeight = currentHeight - offset;
        const newPosition = newHeight / window.innerHeight;

        const distances = snapPoints.map((point, index) => ({
            distance: Math.abs(point - newPosition),
            index,
        }));

        const nearest = distances.reduce((prev, curr) =>
            prev.distance < curr.distance ? prev : curr
        );

        setSnapIndex(nearest.index);
    };

    const currentSnapPoint = snapPoints[snapIndex] ?? snapPoints[0] ?? 0.9;
    const sheetHeight = `${currentSnapPoint * 100}%`;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Sheet */}
                    <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        className={cn(
                            "fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] rounded-t-[32px] shadow-2xl border-t border-white/10",
                            className
                        )}
                        style={{ y, maxHeight: '90vh', height: sheetHeight }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>

                        {/* Title */}
                        {title && (
                            <div className="px-6 pb-4 border-b border-white/10">
                                <h2 className="text-xl font-bold text-white">{title}</h2>
                            </div>
                        )}

                        {/* Content */}
                        <div
                            className="px-6 py-4 overflow-y-auto"
                            style={{
                                maxHeight: `calc(${sheetHeight} - ${title ? '100px' : '60px'})`,
                            }}
                        >
                            {children}
                        </div>

                        {/* Safe area padding for iOS */}
                        <div className="pb-safe" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

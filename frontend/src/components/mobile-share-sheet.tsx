'use client';

import { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIOSHaptics } from '@/hooks/use-ios-haptics';

interface ShareData {
    title: string;
    text: string;
    url: string;
}

interface MobileShareSheetProps {
    data: ShareData;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Check if Web Share API is supported
 */
function isShareSupported(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Mobile Share Sheet Component
 * 
 * Uses native Web Share API on supported browsers (iOS Safari, Android Chrome)
 * Falls back to copy-to-clipboard with manual sharing options
 */
export function MobileShareSheet({ data, isOpen, onClose }: MobileShareSheetProps) {
    const [copied, setCopied] = useState(false);
    const { triggerHaptic } = useIOSHaptics();
    const shareSupported = isShareSupported();

    const handleNativeShare = async () => {
        if (!shareSupported) return;

        try {
            await navigator.share(data);
            triggerHaptic('success');
            onClose();
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                // User didn't cancel, actual error occurred
                console.error('[Share] Native share failed:', error);
                triggerHaptic('error');
            }
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(data.url);
            setCopied(true);
            triggerHaptic('success');

            setTimeout(() => {
                setCopied(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error('[Share] Copy failed:', error);
            triggerHaptic('error');
        }
    };

    if (!isOpen) return null;

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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Share Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom"
                    >
                        <div className="bg-[#1a1a1a] rounded-t-3xl border-t border-white/10 p-6 pb-8">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white">Share</h3>
                                <button
                                    onClick={() => {
                                        triggerHaptic('light');
                                        onClose();
                                    }}
                                    className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Share Content */}
                            <div className="space-y-4">
                                {/* Title & Description */}
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <h4 className="font-bold text-white mb-1">{data.title}</h4>
                                    <p className="text-sm text-white/60">{data.text}</p>
                                </div>

                                {/* Share Actions */}
                                <div className="space-y-2">
                                    {shareSupported && (
                                        <button
                                            onClick={handleNativeShare}
                                            className="w-full flex items-center gap-3 p-4 bg-primary hover:bg-primary/90 rounded-xl transition-colors"
                                        >
                                            <Share2 className="w-5 h-5 text-black" />
                                            <span className="font-semibold text-black">Share via...</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={handleCopyLink}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-4 rounded-xl transition-all",
                                            copied
                                                ? "bg-green-500/20 text-green-400"
                                                : "bg-white/10 hover:bg-white/15 text-white"
                                        )}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-5 h-5" />
                                                <span className="font-semibold">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-5 h-5" />
                                                <span className="font-semibold">Copy Link</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* URL Preview */}
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-xs text-white/40 font-mono truncate">{data.url}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * Hook for managing share sheet state
 * 
 * @returns Share sheet utilities
 * 
 * @example
 * ```tsx
 * const { shareData, ShareSheet } = useShareSheet();
 * 
 * <button onClick={() => shareData({
 *   title: 'Song Name',
 *   text: 'Check out this track!',
 *   url: window.location.href
 * })}>
 *   Share
 * </button>
 * <ShareSheet />
 * ```
 */
export function useShareSheet() {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<ShareData>({
        title: '',
        text: '',
        url: '',
    });

    const shareData = (shareData: ShareData) => {
        setData(shareData);
        setIsOpen(true);
    };

    const ShareSheetComponent = () => (
        <MobileShareSheet
            data={data}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
        />
    );

    return {
        shareData,
        ShareSheet: ShareSheetComponent,
        isOpen,
        close: () => setIsOpen(false),
    };
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const shortcuts = [
    { key: 'Space', action: 'Play / Pause' },
    { key: '←', action: 'Previous Track' },
    { key: '→', action: 'Next Track' },
    { key: 'M', action: 'Mute / Unmute' },
    { key: '↑', action: 'Volume Up' },
    { key: '↓', action: 'Volume Down' },
    { key: 'S', action: 'Toggle Shuffle' },
    { key: 'R', action: 'Toggle Repeat' },
    { key: 'C', action: 'Open Chat' },
    { key: 'Q', action: 'Open Queue' },
    { key: '?', action: 'Show Shortcuts' },
    { key: 'Esc', action: 'Close Panel' },
];

export function KeyboardShortcutsPanel({ isOpen, onClose }: KeyboardShortcutsPanelProps) {
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101]
                                   bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl
                                   w-[400px] max-h-[80vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[#333]">
                            <div className="flex items-center gap-3">
                                <Keyboard className="w-5 h-5 text-[#ff3333]" />
                                <h2 className="font-bold text-lg text-white">Keyboard Shortcuts</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-[#333] transition-colors"
                            >
                                <X className="w-5 h-5 text-[#888]" />
                            </button>
                        </div>

                        {/* Shortcuts List */}
                        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                            {shortcuts.map((shortcut) => (
                                <div
                                    key={shortcut.key}
                                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#222] transition-colors"
                                >
                                    <span className="text-[#888] text-sm">{shortcut.action}</span>
                                    <kbd className="px-3 py-1.5 bg-[#222] border border-[#444] rounded-md 
                                                    text-xs font-mono text-white shadow-sm min-w-[40px] text-center">
                                        {shortcut.key}
                                    </kbd>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-[#333] text-center">
                            <p className="text-xs text-[#666]">
                                Press <kbd className="px-1.5 py-0.5 bg-[#222] border border-[#444] rounded text-[10px]">?</kbd> anytime to toggle
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

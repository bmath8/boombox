'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type Shortcut = {
    keys: string[];
    description: string;
    category?: string;
};

const shortcuts: Shortcut[] = [
    { keys: ['Space'], description: 'Play / Pause', category: 'Player' },
    { keys: ['→'], description: 'Next track', category: 'Player' },
    { keys: ['←'], description: 'Previous track', category: 'Player' },
    { keys: ['/'], description: 'Focus search', category: 'Navigation' },
    { keys: ['?'], description: 'Show shortcuts', category: 'Navigation' },
    { keys: ['Esc'], description: 'Close modal / Blur search', category: 'Navigation' },
];

/**
 * Keyboard Shortcuts Modal
 *
 * Displays all available keyboard shortcuts in a modal dialog.
 * Can be triggered by pressing '?' or by dispatching 'shortcuts:show' event.
 */
export function KeyboardShortcutsModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleShow = () => setIsOpen(true);
        const handleHide = () => setIsOpen(false);

        document.addEventListener('shortcuts:show', handleShow);
        document.addEventListener('shortcuts:hide', handleHide);

        return () => {
            document.removeEventListener('shortcuts:show', handleShow);
            document.removeEventListener('shortcuts:hide', handleHide);
        };
    }, []);

    // Group shortcuts by category
    const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
        const category = shortcut.category || 'General';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(shortcut);
        return acc;
    }, {} as Record<string, Shortcut[]>);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-dark rounded-2xl border border-white/10 max-w-2xl w-full p-6 shadow-2xl"
                            role="dialog"
                            aria-labelledby="shortcuts-title"
                            aria-describedby="shortcuts-description"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2
                                        id="shortcuts-title"
                                        className="text-2xl font-bold text-white"
                                    >
                                        Keyboard Shortcuts
                                    </h2>
                                    <p
                                        id="shortcuts-description"
                                        className="text-sm text-muted-foreground mt-1"
                                    >
                                        Navigate faster with keyboard shortcuts
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    aria-label="Close shortcuts modal"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Shortcuts List */}
                            <div className="space-y-6">
                                {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                                    <div key={category}>
                                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
                                            {category}
                                        </h3>
                                        <div className="space-y-2">
                                            {categoryShortcuts.map((shortcut, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <span className="text-white">
                                                        {shortcut.description}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        {shortcut.keys.map((key) => (
                                                            <kbd
                                                                key={key}
                                                                className={cn(
                                                                    'px-3 py-1.5 bg-black/40 border border-white/20',
                                                                    'rounded-md text-sm font-mono text-white/90',
                                                                    'shadow-[0_2px_0_0_rgba(255,255,255,0.1)]'
                                                                )}
                                                            >
                                                                {key}
                                                            </kbd>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="mt-6 pt-4 border-t border-white/10">
                                <p className="text-xs text-muted-foreground text-center">
                                    Press <kbd className="px-2 py-0.5 bg-black/40 border border-white/20 rounded text-xs font-mono">?</kbd> anytime to view shortcuts
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

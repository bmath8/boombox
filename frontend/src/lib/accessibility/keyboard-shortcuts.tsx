'use client';

import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Keyboard Shortcuts System
 *
 * Global keyboard shortcuts for accessibility and power users
 * Implements WCAG 2.1 keyboard navigation guidelines
 */

export interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    description: string;
    action: () => void;
    enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
    shortcuts: KeyboardShortcut[];
    enabled?: boolean;
}

export function useKeyboardShortcuts({
    shortcuts,
    enabled = true,
}: UseKeyboardShortcutsOptions) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Don't trigger shortcuts when typing in inputs
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                // Allow certain shortcuts even in inputs (like Escape)
                if (event.key !== 'Escape') return;
            }

            for (const shortcut of shortcuts) {
                if (shortcut.enabled === false) continue;

                const matches =
                    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
                    !!event.ctrlKey === !!shortcut.ctrlKey &&
                    !!event.shiftKey === !!shortcut.shiftKey &&
                    !!event.altKey === !!shortcut.altKey &&
                    !!event.metaKey === !!shortcut.metaKey;

                if (matches) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        },
        [shortcuts, enabled]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Show keyboard shortcuts help
 */
export function showKeyboardShortcutsHelp(shortcuts: KeyboardShortcut[]) {
    const helpText = shortcuts
        .filter((s) => s.enabled !== false)
        .map((s) => {
            const keys = [];
            if (s.ctrlKey) keys.push('Ctrl');
            if (s.shiftKey) keys.push('Shift');
            if (s.altKey) keys.push('Alt');
            if (s.metaKey) keys.push('⌘');
            keys.push(s.key.toUpperCase());
            return `${keys.join('+')} - ${s.description}`;
        })
        .join('\n');

    alert(`Keyboard Shortcuts:\n\n${helpText}`);
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
    const keys = [];
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.metaKey) keys.push('⌘');
    keys.push(shortcut.key.toUpperCase());
    return keys.join('+');
}

/**
 * Default keyboard shortcuts for music player
 */
export const DEFAULT_PLAYER_SHORTCUTS: KeyboardShortcut[] = [
    {
        key: ' ',
        description: 'Play/Pause',
        action: () => {
            // Will be implemented by parent component
        },
    },
    {
        key: 'ArrowRight',
        description: 'Next track',
        action: () => {},
    },
    {
        key: 'ArrowLeft',
        description: 'Previous track',
        action: () => {},
    },
    {
        key: 'ArrowUp',
        description: 'Volume up',
        action: () => {},
    },
    {
        key: 'ArrowDown',
        description: 'Volume down',
        action: () => {},
    },
    {
        key: 'm',
        description: 'Mute/Unmute',
        action: () => {},
    },
    {
        key: '/',
        description: 'Focus search',
        action: () => {},
    },
    {
        key: '?',
        shiftKey: true,
        description: 'Show keyboard shortcuts',
        action: () => {},
    },
    {
        key: 'Escape',
        description: 'Close modal/dialog',
        action: () => {},
    },
];

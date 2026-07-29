'use client';

import { useEffect } from 'react';

/**
 * Global Keyboard Shortcuts Hook
 *
 * Provides keyboard shortcuts for common actions throughout the app.
 * Automatically ignores shortcuts when user is typing in input fields.
 *
 * Shortcuts:
 * - Space: Play/Pause
 * - →: Next track
 * - ←: Previous track
 * - /: Focus search
 * - ?: Show shortcuts modal
 *
 * Usage:
 * Call this hook in your root layout to enable global shortcuts
 */
export function useKeyboardShortcuts() {
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore shortcuts if user is typing in an input or textarea
            const target = e.target as HTMLElement;
            if (
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target.isContentEditable
            ) {
                // Allow '/' to focus search even from input (Escape first)
                if (e.key === '/' && !(target.dataset['searchInput'] === 'true')) {
                    return;
                }
            }

            switch (e.key) {
                case ' ':
                    // Space: Play/Pause
                    e.preventDefault();
                    document.dispatchEvent(new CustomEvent('player:toggle'));
                    break;

                case 'ArrowRight':
                    // Right Arrow: Next track
                    e.preventDefault();
                    document.dispatchEvent(new CustomEvent('player:next'));
                    break;

                case 'ArrowLeft':
                    // Left Arrow: Previous track
                    e.preventDefault();
                    document.dispatchEvent(new CustomEvent('player:previous'));
                    break;

                case '/':
                    // Forward slash: Focus search
                    e.preventDefault();
                    const searchInput = document.querySelector<HTMLInputElement>(
                        '[data-search-input]'
                    );
                    if (searchInput) {
                        searchInput.focus();
                    }
                    break;

                case '?':
                    // Question mark: Show shortcuts modal
                    e.preventDefault();
                    document.dispatchEvent(new CustomEvent('shortcuts:show'));
                    break;

                case 'Escape':
                    // Escape: Close shortcuts modal or blur search
                    document.dispatchEvent(new CustomEvent('shortcuts:hide'));
                    if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                    }
                    break;

                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, []);
}

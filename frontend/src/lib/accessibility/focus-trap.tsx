'use client';

import { useEffect, useRef, ReactNode } from 'react';

/**
 * Focus Trap Component
 *
 * Traps focus within a container (for modals, dialogs, etc.)
 * Implements WCAG 2.1 keyboard navigation
 */

interface FocusTrapProps {
    children: ReactNode;
    active?: boolean;
    onEscape?: () => void;
}

export function FocusTrap({ children, active = true, onEscape }: FocusTrapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!active) return;

        // Store the currently focused element
        previousFocusRef.current = document.activeElement as HTMLElement;

        // Focus the first focusable element in the container
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0]?.focus();
        }

        // Restore focus when unmounting
        return () => {
            previousFocusRef.current?.focus();
        };
    }, [active]);

    useEffect(() => {
        if (!active) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Handle Escape key
            if (e.key === 'Escape' && onEscape) {
                e.preventDefault();
                onEscape();
                return;
            }

            // Handle Tab key
            if (e.key === 'Tab') {
                const focusableElements = getFocusableElements();
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement?.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement?.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [active, onEscape]);

    const getFocusableElements = (): HTMLElement[] => {
        if (!containerRef.current) return [];

        const selector = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        return Array.from(containerRef.current.querySelectorAll(selector));
    };

    return <div ref={containerRef}>{children}</div>;
}

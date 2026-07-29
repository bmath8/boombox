'use client';

import { useEffect, useState } from 'react';

/**
 * Live Region for Screen Reader Announcements
 *
 * ARIA live region for announcing dynamic content changes to screen readers
 * Implements WCAG 2.1 guidelines for status messages
 */

interface LiveRegionProps {
    message: string;
    politeness?: 'polite' | 'assertive';
    clearAfter?: number; // ms
}

export function LiveRegion({
    message,
    politeness = 'polite',
    clearAfter = 3000,
}: LiveRegionProps) {
    const [currentMessage, setCurrentMessage] = useState('');

    useEffect(() => {
        if (message) {
            setCurrentMessage(message);

            if (clearAfter > 0) {
                const timeout = setTimeout(() => {
                    setCurrentMessage('');
                }, clearAfter);

                return () => clearTimeout(timeout);
            }
        }
    }, [message, clearAfter]);

    return (
        <div
            role="status"
            aria-live={politeness}
            aria-atomic="true"
            className="sr-only"
        >
            {currentMessage}
        </div>
    );
}

/**
 * Hook for announcing messages to screen readers
 */
export function useLiveAnnouncer() {
    const [message, setMessage] = useState('');
    const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite');

    const announce = (text: string, priority: 'polite' | 'assertive' = 'polite') => {
        setPoliteness(priority);
        setMessage(text);
    };

    return {
        announce,
        LiveRegion: () => <LiveRegion message={message} politeness={politeness} />,
    };
}

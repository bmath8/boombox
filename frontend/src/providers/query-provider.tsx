'use client';

import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';

/**
 * React Query Provider
 *
 * Wraps the app with TanStack Query functionality.
 * Includes dev tools in development mode.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [showDevtools, setShowDevtools] = useState(false);

    // Only show devtools on client side to prevent hydration errors
    useEffect(() => {
        setShowDevtools(process.env.NODE_ENV === 'development');
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {showDevtools && (
                <ReactQueryDevtools
                    initialIsOpen={false}
                    buttonPosition="bottom-right"
                />
            )}
        </QueryClientProvider>
    );
}

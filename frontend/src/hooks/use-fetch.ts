import { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

const cache = new Map<string, { data: unknown; timestamp: number }>();
const pendingRequests = new Map<string, Promise<unknown>>();

type UseFetchOptions = {
    revalidateOnFocus?: boolean;
    dedupingInterval?: number; // Time in ms to use cached data
};

export function useFetch<T>(key: string | null, fetcher: () => Promise<T>, options: UseFetchOptions = {}) {
    const { dedupingInterval = 2000 } = options;
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!key) return;

        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);

            // Check cache first
            const cached = cache.get(key);
            if (cached && Date.now() - cached.timestamp < dedupingInterval) {
                logger.debug(`[useFetch] Cache hit for ${key}`);
                setData(cached.data as T);
                setLoading(false);
                return;
            }

            // Check for pending request (deduplication)
            if (pendingRequests.has(key)) {
                logger.debug(`[useFetch] Deduplicating request for ${key}`);
                try {
                    const result = await pendingRequests.get(key);
                    if (isMounted) {
                        setData(result as T);
                        setLoading(false);
                    }
                } catch (err) {
                    if (isMounted) {
                        setError(err as Error);
                        setLoading(false);
                    }
                }
                return;
            }

            // Make new request
            logger.debug(`[useFetch] Fetching ${key}`);
            const promise = fetcher();
            pendingRequests.set(key, promise);

            try {
                const result = await promise;

                // Update cache
                cache.set(key, { data: result, timestamp: Date.now() });

                if (isMounted) {
                    setData(result);
                    setError(null);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
                logger.error(`[useFetch] Error fetching ${key}: ${errorMessage}`);
                if (isMounted) {
                    setError(err as Error);
                }
            } finally {
                pendingRequests.delete(key);
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, dedupingInterval]); // fetcher is intentionally omitted to avoid infinite loops if defined inline

    // Function to manually mutate/refresh the data
    const mutate = async () => {
        if (!key) return;
        cache.delete(key);
        // Re-run the effect by toggling a key or we can just call the logic again. 
        // For simplicity in this lightweight hook, we'll just clear cache and let the next render or manual call handle it, 
        // but to force update we might need a trigger. 
        // Actually, let's just re-fetch manually here.
        setLoading(true);
        try {
            const result = await fetcher();
            cache.set(key, { data: result, timestamp: Date.now() });
            setData(result);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    return { data, error, loading, mutate };
}

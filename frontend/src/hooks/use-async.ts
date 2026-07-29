'use client';

import { useState, useCallback } from 'react';
import { handleError } from '@/lib/error-handler';

export interface UseAsyncOptions {
    onSuccess?: (data: any) => void;
    onError?: (error: unknown) => void;
    showErrorToast?: boolean;
}

export interface UseAsyncReturn<T> {
    execute: (...args: any[]) => Promise<T | undefined>;
    loading: boolean;
    error: unknown | null;
    data: T | null;
    reset: () => void;
}

/**
 * Hook for handling async operations with loading and error states
 *
 * Usage:
 * ```tsx
 * const { execute, loading, error, data } = useAsync<User>(
 *   async (id) => fetchUser(id),
 *   {
 *     onSuccess: (user) => console.log('User loaded:', user),
 *     onError: (error) => console.error('Failed:', error),
 *   }
 * );
 *
 * <Button onClick={() => execute(userId)} loading={loading}>
 *   Load User
 * </Button>
 * ```
 */
export function useAsync<T = any>(
    asyncFunction: (...args: any[]) => Promise<T>,
    options: UseAsyncOptions = {}
): UseAsyncReturn<T> {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown | null>(null);
    const [data, setData] = useState<T | null>(null);

    const execute = useCallback(
        async (...args: any[]): Promise<T | undefined> => {
            setLoading(true);
            setError(null);

            try {
                const result = await asyncFunction(...args);
                setData(result);
                options.onSuccess?.(result);
                return result;
            } catch (err) {
                setError(err);
                options.onError?.(err);

                // Show error toast by default
                if (options.showErrorToast !== false) {
                    handleError(err, 'Async Operation');
                }

                return undefined;
            } finally {
                setLoading(false);
            }
        },
        [asyncFunction, options]
    );

    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
        setData(null);
    }, []);

    return {
        execute,
        loading,
        error,
        data,
        reset,
    };
}

/**
 * Hook for handling form submissions with loading states
 *
 * Usage:
 * ```tsx
 * const { handleSubmit, loading } = useFormSubmit(async (formData) => {
 *   await saveUser(formData);
 * });
 *
 * <form onSubmit={handleSubmit}>
 *   <Button type="submit" loading={loading}>Save</Button>
 * </form>
 * ```
 */
export function useFormSubmit<T = any>(
    onSubmit: (data: T) => Promise<void>,
    options: UseAsyncOptions = {}
) {
    const { execute, loading, error } = useAsync(onSubmit, options);

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData) as unknown as T;
            execute(data);
        },
        [execute]
    );

    return {
        handleSubmit,
        loading,
        error,
    };
}

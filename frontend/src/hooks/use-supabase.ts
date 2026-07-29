import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/env';
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

interface UseSupabaseResult {
    supabase: SupabaseClient | null;
    isConfigured: boolean;
    user: User | null;
    session: Session | null;
    loading: boolean;
    error: Error | null;
}

/**
 * Hook to safely use Supabase client in components
 * Handles null checks and provides auth state
 */
export function useSupabase(): UseSupabaseResult {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const isConfigured = isSupabaseConfigured();

    useEffect(() => {
        if (!isConfigured || !supabase) {
            setLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession()
            .then(({ data: { session }, error }) => {
                if (error) {
                    setError(error);
                } else {
                    setSession(session);
                    setUser(session?.user ?? null);
                }
                setLoading(false);
            })
            .catch((err) => {
                setError(err);
                setLoading(false);
            });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [isConfigured]);

    return {
        supabase,
        isConfigured,
        user,
        session,
        loading,
        error,
    };
}

/**
 * Hook to require Supabase - shows error if not configured
 */
export function useRequireSupabase() {
    const result = useSupabase();

    useEffect(() => {
        if (!result.loading && !result.isConfigured) {
            console.error('Supabase is required but not configured');
        }
    }, [result.loading, result.isConfigured]);

    return result;
}

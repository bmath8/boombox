"use client";

import React, { useState, useEffect } from "react";
import { BoomboxFrame } from "@/components/boombox/BoomboxFrame";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured, isSpotifyConfigured } from "@/lib/env";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);

    useEffect(() => {
        // Check configuration on mount
        if (!isSupabaseConfigured()) {
            setConfigError("Supabase not configured. Please set environment variables.");
            console.error("Missing Supabase configuration. Check .env.local or Vercel settings.");
        }
    }, []);

    const handleLogin = async (email: string, password: string) => {
        if (!isSupabaseConfigured()) {
            alert("Login is not available. Supabase is not configured.\n\nPlease set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.");
            return;
        }

        setIsLoading(true);
        try {
            // Try to sign in first
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });

                if (signUpError) {
                    alert(`Error: ${signUpError.message}`);
                } else {
                    alert("Check your email for confirmation!");
                }
            } else {
                router.push('/radio');
            }
        } catch (error) {
            console.error("Auth error:", error);
            alert(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const DEMO_EMAIL = "demo@boombox.app";
    const DEMO_PASSWORD = "BoomBoxDemo2026";
    const handleDemoLogin = () => handleLogin(DEMO_EMAIL, DEMO_PASSWORD);

    const handleSpotifyLogin = async () => {
        if (!supabase) {
            alert("Spotify login is not available. Supabase is not configured.\n\nPlease set environment variables in Vercel dashboard.");
            return;
        }

        if (!isSpotifyConfigured()) {
            alert("Spotify OAuth is not configured.\n\nPlease set NEXT_PUBLIC_SPOTIFY_CLIENT_ID in Vercel dashboard.");
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'spotify',
                options: {
                    redirectTo: `${window.location.origin}/api/auth/callback/spotify`,
                    scopes: 'user-read-email user-read-private playlist-read-private playlist-modify-public playlist-modify-private user-read-currently-playing user-modify-playback-state streaming'
                }
            });

            if (error) {
                console.error("Spotify OAuth error:", error);
                alert(`Spotify login error: ${error.message}`);
            }
        } catch (error) {
            console.error("Spotify login error:", error);
            alert(`Spotify login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black text-white">
            {configError && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-4 py-2 rounded-lg text-sm z-50">
                    ⚠️ {configError}
                </div>
            )}
            <BoomboxFrame
                onLogin={handleLogin}
                onSpotifyLogin={handleSpotifyLogin}
                onDemoLogin={handleDemoLogin}
                isLoading={isLoading}
            />
        </main>
    );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Play, Music, Disc, Loader2 } from "lucide-react";

interface CassetteDeckProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onSpotifyLogin: () => void;
    isLoading?: boolean;
}

export function CassetteDeck({ onLogin, onSpotifyLogin, isLoading }: CassetteDeckProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSpinning, setIsSpinning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleLogin();
    };

    const handleLogin = async () => {
        if (!email || !password) {
            alert("Please enter email and password");
            return;
        }

        setIsSubmitting(true);
        setIsSpinning(true);

        try {
            await onLogin(email, password);
        } catch (error) {
            console.error("Login error:", error);
            alert("Login failed. Please try again.");
        } finally {
            setIsSubmitting(false);
            setIsSpinning(false);
        }
    };

    const handleSpotifyClick = () => {
        console.log("Spotify login clicked");
        onSpotifyLogin();
    };

    const spin = () => {
        if (!isSpinning) {
            setIsSpinning(true);
            setTimeout(() => setIsSpinning(false), 500);
        }
    };

    const buttonDisabled = isLoading || isSubmitting;

    return (
        <div className="relative z-50 bg-gradient-to-b from-[#111114] to-[#0c0c0f] rounded-[8px] border-[2px] border-[#252530] overflow-hidden flex flex-col w-full max-w-[420px]">

            {/* Deck Header */}
            <div className="flex justify-between items-center px-[12px] py-[6px] bg-gradient-to-b from-[#18181c] to-[#141418] border-b border-[var(--border-boombox)]">
                <span className="font-[family-name:var(--font-share)] text-[8px] text-[#555] tracking-[1px]">▶ DECK A — AUTHENTICATE</span>
                <span className="font-[family-name:var(--font-share)] text-[10px] text-[var(--orange)] bg-[#080808] px-[10px] py-[3px] rounded-[3px] border border-[#1a1a1f] tracking-[2px] min-w-[70px] text-center">
                    {buttonDisabled ? "LOADING..." : "READY"}
                </span>
            </div>

            <div className="p-4 flex flex-col gap-4">

                {/* Realistic Tape Window */}
                <div className="relative h-[100px] bg-[#08080a] border-[2px] border-[#1e1e24] rounded-[6px] flex items-center justify-center gap-8 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] overflow-hidden">

                    {/* Background Mechanics */}
                    <div className="absolute inset-0 bg-[#0a0a0c] opacity-50" />

                    {/* Left Reel (3-Spoke Design) */}
                    <div className={cn("w-[56px] h-[56px] rounded-full relative shadow-lg transition-transform will-change-transform z-10", isSpinning && "animate-[spin_2s_linear_infinite]")}>
                        {/* Tape Pack (Brown) */}
                        <div className="absolute inset-0 rounded-full bg-[#3f302a] border-[1px] border-[#2a1f1b]" />
                        {/* White Plastic Hub */}
                        <div className="absolute inset-[4px] rounded-full bg-[#e8e8e8] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_60deg,#ccc_60deg,#ccc_120deg,transparent_120deg,transparent_180deg,#ccc_180deg,#ccc_240deg,transparent_240deg,transparent_300deg,#ccc_300deg,#ccc_360deg)] opacity-20" />
                            <div className="absolute w-[12px] h-[12px] bg-[#1a1a1f] rounded-full" />
                            <div className="absolute w-[4px] h-[4px] bg-[#e8e8e8] rounded-full top-[10px]" />
                            <div className="absolute w-[4px] h-[4px] bg-[#e8e8e8] rounded-full bottom-[10px] left-[14px]" />
                            <div className="absolute w-[4px] h-[4px] bg-[#e8e8e8] rounded-full bottom-[10px] right-[14px]" />
                        </div>
                    </div>

                    {/* Tape Window Bridge */}
                    <div className="h-[24px] w-[60px] bg-[#000] rounded-[2px] relative z-10 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-[80%] bg-[#3f302a] opacity-80" />
                    </div>

                    {/* Right Reel (3-Spoke Design) */}
                    <div className={cn("w-[56px] h-[56px] rounded-full relative shadow-lg transition-transform will-change-transform z-10", isSpinning && "animate-[spin_2s_linear_infinite]")}>
                        <div className="absolute inset-0 rounded-full border-[6px] border-[#3f302a] bg-transparent" />
                        <div className="absolute inset-[4px] rounded-full bg-[#e8e8e8] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_60deg,#ccc_60deg,#ccc_120deg,transparent_120deg,transparent_180deg,#ccc_180deg,#ccc_240deg,transparent_240deg,transparent_300deg,#ccc_300deg,#ccc_360deg)] opacity-20" />
                            <div className="absolute w-[12px] h-[12px] bg-[#1a1a1f] rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Inputs (Label Area) */}
                <form onSubmit={handleFormSubmit} className="flex gap-3 pt-2">
                    <div className="flex-1 relative group">
                        <span className="absolute -top-[6px] left-[8px] font-[family-name:var(--font-share)] text-[7px] text-[#555] bg-[#111114] px-[4px] tracking-[1px] group-focus-within:text-[var(--orange)] transition-colors z-10">USERNAME / EMAIL</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); spin(); }}
                            placeholder="user@boombox.fm"
                            disabled={buttonDisabled}
                            className="w-full px-3 py-2 bg-[#080808] border border-[#252530] rounded-[4px] text-white font-[family-name:var(--font-share)] text-[11px] tracking-[1px] focus:outline-none focus:border-[var(--orange)] transition-colors placeholder-[#333] disabled:opacity-50"
                        />
                    </div>
                    <div className="flex-1 relative group">
                        <span className="absolute -top-[6px] left-[8px] font-[family-name:var(--font-share)] text-[7px] text-[#555] bg-[#111114] px-[4px] tracking-[1px] group-focus-within:text-[var(--orange)] transition-colors z-10">PASSWORD</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); spin(); }}
                            placeholder="••••••••"
                            disabled={buttonDisabled}
                            className="w-full px-3 py-2 bg-[#080808] border border-[#252530] rounded-[4px] text-white font-[family-name:var(--font-share)] text-[11px] tracking-[1px] focus:outline-none focus:border-[var(--orange)] transition-colors placeholder-[#333] disabled:opacity-50"
                        />
                    </div>
                    <button type="submit" className="hidden" aria-hidden="true" />
                </form>

            </div>

            {/* Controls (Symmetrical: Spotify - Play - Apple) */}
            <div className="relative z-50 flex items-center justify-center gap-8 px-[15px] py-[12px] border-t border-[var(--border-boombox)] bg-[rgba(0,0,0,0.2)]">

                {/* Spotify (Left) */}
                <button
                    type="button"
                    onClick={handleSpotifyClick}
                    disabled={buttonDisabled}
                    title="Login with Spotify"
                    style={{ pointerEvents: 'auto' }}
                    className={cn(
                        "w-[36px] h-[36px] flex items-center justify-center bg-[#1DB954]/10 border border-[#1DB954]/50 rounded-full hover:bg-[#1DB954] hover:text-black hover:scale-110 text-[#1DB954] transition-all shadow-[0_0_10px_rgba(29,185,84,0.2)] hover:shadow-[0_0_15px_rgba(29,185,84,0.4)] cursor-pointer",
                        buttonDisabled && "opacity-50 cursor-not-allowed hover:scale-100 hover:bg-[#1DB954]/10 hover:text-[#1DB954]"
                    )}
                >
                    <Disc className="w-5 h-5" />
                </button>

                {/* Login/Play (Center - Main Focus) */}
                <div className="relative group">
                    <button
                        type="button"
                        onClick={handleLogin}
                        disabled={buttonDisabled}
                        aria-label="Login"
                        title="Play Tape"
                        style={{ pointerEvents: 'auto' }}
                        className={cn(
                            "w-[56px] h-[56px] flex items-center justify-center bg-gradient-to-b from-[var(--orange)] to-[#cc5500] border-[3px] border-[#ff8800] rounded-full text-white shadow-[0_0_20px_var(--orange-glow)] transition-all active:scale-95 group-hover:scale-105 group-hover:shadow-[0_0_30px_var(--orange-glow)] cursor-pointer",
                            buttonDisabled && "opacity-50 cursor-not-allowed grayscale shadow-none group-hover:scale-100"
                        )}
                    >
                        {buttonDisabled ? (
                            <Loader2 className="w-[20px] h-[20px] animate-spin" />
                        ) : (
                            <Play fill="currentColor" className="w-[20px] h-[20px] ml-[3px]" />
                        )}
                    </button>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-[family-name:var(--font-share)] text-[9px] text-[#555] tracking-[1px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {buttonDisabled ? "LOADING" : "LOGIN"}
                    </span>
                </div>

                {/* Apple Music (Right) */}
                <button
                    type="button"
                    onClick={() => alert("Apple Music coming soon!")}
                    disabled={buttonDisabled}
                    title="Login with Apple Music"
                    style={{ pointerEvents: 'auto' }}
                    className={cn(
                        "w-[36px] h-[36px] flex items-center justify-center bg-[#FA243C]/10 border border-[#FA243C]/50 rounded-full hover:bg-[#FA243C] hover:text-white hover:scale-110 text-[#FA243C] transition-all shadow-[0_0_10px_rgba(250,36,60,0.2)] hover:shadow-[0_0_15px_rgba(250,36,60,0.4)] cursor-pointer",
                        buttonDisabled && "opacity-50 cursor-not-allowed hover:scale-100 hover:bg-[#FA243C]/10"
                    )}
                >
                    <Music className="w-5 h-5" />
                </button>

            </div>
        </div>
    );
}

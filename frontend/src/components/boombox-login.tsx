'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function BoomboxLogin() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [powerOn, setPowerOn] = useState(false);

    // Check for existing session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push('/radio');
            }
        };
        checkSession();
    }, [router]);

    // Equalizer animation effect
    useEffect(() => {
        const interval = setInterval(() => {
            const bars = document.querySelectorAll('.eq-bar');
            bars.forEach((bar) => {
                const height = Math.random() * 80 + 20;
                (bar as HTMLElement).style.height = `${height}%`;
            });
        }, 200);
        return () => clearInterval(interval);
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage({ type: 'success', text: `Welcome back, ${data.user?.email}` });
                setPowerOn(true);
                setTimeout(() => window.location.replace('/radio'), 1500);
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { emailRedirectTo: `${location.origin}/auth/callback` },
                });
                if (error) throw error;
                if (data.user && data.user.identities?.length === 0) {
                    setMessage({ type: 'error', text: 'Email already registered. Please login.' });
                } else {
                    setMessage({ type: 'success', text: 'Account created! Redirecting...' });
                    setPowerOn(true);
                    setTimeout(() => window.location.replace('/radio'), 1500);
                }
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Authentication failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("relative w-full max-w-6xl mx-auto p-4 transition-all duration-1000", powerOn && "scale-[1.02] brightness-125")}>
            {/* Handle */}
            <div className="w-1/3 h-12 mx-auto bg-[#1a1a1a] rounded-t-xl border-t-2 border-x-2 border-[#2a2a2a] relative -mb-2 z-0">
                <div className="absolute inset-x-4 top-2 bottom-0 bg-[#0a0a0a] rounded-t-lg shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]" />
                <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-b from-transparent to-[#000000]/50" />
            </div>

            {/* Boombox Frame */}
            <div className="relative bg-gradient-to-b from-[#222] to-[#111] rounded-[4px] p-6 md:p-8 border-4 border-[#333] shadow-[0_50px_100px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.1)] overflow-hidden z-10">

                {/* Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] pointer-events-none" />

                {/* Circuit Lines Animation */}
                <div className="absolute inset-0 pointer-events-none rounded-[4px] overflow-hidden opacity-30">
                    <div className="absolute top-[10%] left-[-100%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-[#ffaa00] to-transparent animate-electric-flow" />
                    <div className="absolute bottom-[10%] right-[-100%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-[#ffaa00] to-transparent animate-electric-flow [animation-delay:2s]" />
                </div>

                {/* Top Control Panel Strip & Equalizer */}
                <div className="h-16 bg-[#111] border-b border-[#333] -mx-8 -mt-8 mb-8 flex items-center justify-between px-8 shadow-[0_5px_10px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    {/* Left LEDs */}
                    <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(255,0,0,0.5)] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                    </div>

                    {/* Modern LED Equalizer */}
                    <div className="flex items-end justify-center gap-[3px] h-10 w-64 bg-[#000] border-2 border-[#111] rounded-md px-2 py-1 shadow-[inset_0_2px_10px_rgba(0,0,0,1)] relative overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#ff3333]/10 via-transparent to-transparent pointer-events-none" />
                        {[...Array(16)].map((_, i) => (
                            <div
                                key={i}
                                className="eq-bar w-3 bg-gradient-to-t from-[#ff3333] via-[#ff6633] to-[#ffaa00] rounded-t-sm shadow-[0_0_8px_currentColor] transition-all duration-100"
                                style={{ height: '20%', filter: 'brightness(1.2)' }}
                            />
                        ))}
                    </div>

                    {/* Right Knobs */}
                    <div className="flex gap-3">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#333] to-[#111] border border-[#444] shadow-lg flex items-center justify-center transform hover:rotate-12 transition-transform">
                                <div className="w-1 h-3 bg-[#ffaa00] rounded-full -mt-2" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Face */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr] gap-6 relative z-10 items-center">

                    {/* Left Speaker */}
                    <div className="hidden md:block aspect-square rounded-full bg-[#0a0a0a] border-4 border-[#1a1a1a] relative shadow-[0_0_20px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.05)] overflow-hidden group">
                        {/* Rubber Surround */}
                        <div className="absolute inset-3 rounded-full border-[14px] border-[#222] shadow-[inset_0_3px_8px_rgba(0,0,0,0.8),0_2px_6px_rgba(0,0,0,0.6)]" style={{ borderImage: 'linear-gradient(135deg, #1a1a1a, #2a2a2a, #1a1a1a) 1' }} />

                        {/* Cone */}
                        <div className="absolute inset-10 rounded-full bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#000] shadow-[inset_0_0_25px_rgba(0,0,0,1)] flex items-center justify-center">
                            {/* Cone Texture */}
                            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.02)_45deg,transparent_90deg)] opacity-40" />
                            {/* Fine Mesh */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle,#2a2a2a_0.5px,transparent_0.5px)] [background-size:2px_2px] opacity-25" />

                            {/* Chrome Dust Cap */}
                            <div className="w-2/5 h-2/5 rounded-full bg-gradient-to-br from-[#e0e0e0] via-[#999] to-[#666] shadow-[0_6px_12px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-75 relative">
                                {/* Chrome shine */}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-black/20" />
                                <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] rounded-full bg-white/60 blur-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Center Section */}
                    <div className="flex flex-col gap-6">
                        {/* Logo */}
                        <div className="text-center relative">
                            <h1 className="font-black text-7xl tracking-[-0.05em] relative">
                                <span className="absolute inset-0 text-[#ffaa00] blur-md opacity-50">BOOMBOX</span>
                                <span className="relative bg-gradient-to-b from-[#fff] via-[#e0e0e0] to-[#999] bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(255,170,0,0.3)] [text-shadow:2px_2px_0_#000,-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000]">BOOMBOX</span>
                            </h1>
                        </div>

                        {/* Cassette Deck / Login */}
                        <div className="bg-[#080808] rounded-lg border-t border-l border-[#333] border-b border-r border-[#111] p-6 relative shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">

                            {/* Tape Window */}
                            <div className="bg-[#151515] rounded border-2 border-[#2a2a2a] p-4 mb-6 relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />

                                <div className="flex justify-between items-center px-4 relative z-10">
                                    {/* Left Reel */}
                                    <div className={cn("w-14 h-14 rounded-full border-4 border-[#ccc] bg-[#111] relative shadow-lg flex items-center justify-center", loading ? "animate-spin" : "")}>
                                        <div className="w-full h-full rounded-full border-2 border-dashed border-[#444] opacity-50" />
                                        <div className="absolute w-12 h-2 bg-[#222] rotate-45" />
                                        <div className="absolute w-12 h-2 bg-[#222] -rotate-45" />
                                    </div>

                                    {/* Tape Label Area (Inputs) */}
                                    <div className="flex-1 mx-4 bg-[#f0f0f0] h-28 rounded-[2px] flex flex-col items-center justify-center p-1 shadow-[0_1px_3px_rgba(0,0,0,0.3)] transform rotate-0 relative">
                                        {/* Tape Sticker Texture */}
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-20" />

                                        <div className="w-full h-full border-2 border-[#d0d0d0] rounded-[1px] p-2 flex flex-col justify-center gap-2 relative z-10">
                                            <div className="absolute top-1 left-2 text-[8px] font-bold text-[#111] uppercase">Side A</div>
                                            <div className="absolute top-1 right-2 text-[8px] font-bold text-[#111] uppercase">60 min</div>

                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-transparent border-b-2 border-[#999] text-[#111] font-handwriting text-sm px-2 py-1 outline-none placeholder:text-[#666] text-center focus:border-[#000] transition-colors"
                                                placeholder="EMAIL"
                                                required
                                            />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-transparent border-b-2 border-[#999] text-[#111] font-handwriting text-sm px-2 py-1 outline-none placeholder:text-[#666] text-center focus:border-[#000] transition-colors"
                                                placeholder="PASSWORD"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Right Reel */}
                                    <div className={cn("w-14 h-14 rounded-full border-4 border-[#ccc] bg-[#111] relative shadow-lg flex items-center justify-center", loading ? "animate-spin" : "")}>
                                        <div className="w-full h-full rounded-full border-2 border-dashed border-[#444] opacity-50" />
                                        <div className="absolute w-12 h-2 bg-[#222] rotate-45" />
                                        <div className="absolute w-12 h-2 bg-[#222] -rotate-45" />
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleAuth}
                                    disabled={loading}
                                    className="h-14 bg-gradient-to-b from-[#333] to-[#222] rounded-b-lg border-b-4 border-[#111] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 group hover:brightness-110 shadow-lg"
                                >
                                    <div className="w-4 h-4 rounded-full bg-[#ff3333] shadow-[0_0_10px_#ff3333] group-hover:animate-pulse border border-[#900]" />
                                    <span className="font-bold text-[#e0e0e0] text-sm tracking-widest">PLAY</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="h-14 bg-gradient-to-b from-[#333] to-[#222] rounded-b-lg border-b-4 border-[#111] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 group hover:brightness-110 shadow-lg"
                                >
                                    <div className="w-4 h-4 rounded-full bg-[#33ff33] shadow-[0_0_10px_#33ff33] opacity-50 group-hover:opacity-100 border border-[#090]" />
                                    <span className="font-bold text-[#e0e0e0] text-sm tracking-widest">{isLogin ? "REC" : "STOP"}</span>
                                </button>
                            </div>

                            {/* Message Display */}
                            <AnimatePresence>
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={cn(
                                            "mt-4 text-center font-mono text-xs py-2 rounded border",
                                            message.type === 'error' ? "text-red-400 bg-red-900/20 border-red-900/50" : "text-green-400 bg-green-900/20 border-green-900/50"
                                        )}
                                    >
                                        {message.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    </div>

                    {/* Right Speaker */}
                    <div className="hidden md:block aspect-square rounded-full bg-[#0a0a0a] border-4 border-[#1a1a1a] relative shadow-[0_0_20px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.05)] overflow-hidden group">
                        {/* Rubber Surround */}
                        <div className="absolute inset-3 rounded-full border-[14px] border-[#222] shadow-[inset_0_3px_8px_rgba(0,0,0,0.8),0_2px_6px_rgba(0,0,0,0.6)]" style={{ borderImage: 'linear-gradient(135deg, #1a1a1a, #2a2a2a, #1a1a1a) 1' }} />

                        {/* Cone */}
                        <div className="absolute inset-10 rounded-full bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#000] shadow-[inset_0_0_25px_rgba(0,0,0,1)] flex items-center justify-center">
                            {/* Cone Texture */}
                            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.02)_45deg,transparent_90deg)] opacity-40" />
                            {/* Fine Mesh */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle,#2a2a2a_0.5px,transparent_0.5px)] [background-size:2px_2px] opacity-25" />

                            {/* Chrome Dust Cap */}
                            <div className="w-2/5 h-2/5 rounded-full bg-gradient-to-br from-[#e0e0e0] via-[#999] to-[#666] shadow-[0_6px_12px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-75 relative">
                                {/* Chrome shine */}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-black/20" />
                                <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] rounded-full bg-white/60 blur-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

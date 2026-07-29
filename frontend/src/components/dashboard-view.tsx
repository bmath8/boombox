"use client";

import { Music2, Radio, Users, Activity, Play, Pause, SkipForward, Volume2 } from 'lucide-react';
import { LiveFeed } from '@/components/live-feed';
import { DiscoveryFeed } from '@/components/discovery-feed';
import { NotificationCenter } from '@/components/notification-center';
import Link from 'next/link';
import { useState } from 'react';

export function DashboardView() {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground relative">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b-4 border-border">
                <div className="container-asymmetric py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-primary flex items-center justify-center transition-transform group-hover:scale-110">
                            <Music2 className="w-6 h-6 text-background" />
                        </div>
                        <span className="font-heading text-2xl tracking-wider bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-bold">BOOMBOX</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/" className="font-mono text-sm px-4 py-2 bg-primary text-background border-2 border-primary">
                            <Activity className="w-4 h-4 inline mr-2" />
                            Feed
                        </Link>
                        <Link href="/radio" className="font-mono text-sm px-4 py-2 border-2 border-border hover:border-foreground transition-colors">
                            <Radio className="w-4 h-4 inline mr-2" />
                            Stations
                        </Link>
                        <Link href="/discover" className="font-mono text-sm px-4 py-2 border-2 border-border hover:border-foreground transition-colors">
                            <Users className="w-4 h-4 inline mr-2" />
                            Discover
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <NotificationCenter />
                        <Link
                            href="/radio/new"
                            className="px-6 py-3 bg-secondary text-background font-heading border-4 border-secondary hover:bg-background hover:text-secondary transition-all"
                        >
                            Broadcast
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content - Centered Player Layout */}
            <main className="container-asymmetric py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar: Stats */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="border-t-4 border-primary pt-4">
                            <h3 className="font-heading text-2xl mb-6">Your Stats</h3>

                            <div className="space-y-4">
                                <div className="bg-muted border-4 border-border p-4 hover:border-primary transition-colors">
                                    <p className="font-mono text-3xl font-bold text-primary">142</p>
                                    <p className="font-mono text-xs text-muted-foreground uppercase tracking-wide">Tracks Shared</p>
                                </div>

                                <div className="bg-muted border-4 border-border p-4 hover:border-secondary transition-colors">
                                    <p className="font-mono text-3xl font-bold text-secondary">28</p>
                                    <p className="font-mono text-xs text-muted-foreground uppercase tracking-wide">Connections</p>
                                </div>

                                <div className="bg-muted border-4 border-border p-4 hover:border-accent transition-colors">
                                    <p className="font-mono text-3xl font-bold text-accent">12h</p>
                                    <p className="font-mono text-xs text-muted-foreground uppercase tracking-wide">This Week</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center: Main Player */}
                    <div className="lg:col-span-6">
                        {/* Now Playing - Centered */}
                        <div className="bg-muted border-4 border-primary p-8 mb-8">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
                                <span className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                                    Now Playing
                                </span>
                            </div>

                            {/* Improved Vinyl Player */}
                            <div className="relative aspect-square max-w-md mx-auto mb-6">
                                <div className="relative w-full h-full bg-background border-4 border-border p-6">
                                    {/* Vinyl Disc */}
                                    <div className={`relative w-full h-full transition-transform duration-1000 ${isPlaying ? 'animate-[vinyl-spin_3s_linear_infinite]' : ''}`}>
                                        {/* Outer Ring */}
                                        <div className="absolute inset-0 rounded-full border-8 border-primary">
                                            {/* Grooves */}
                                            <div className="absolute inset-4 rounded-full border-4 border-primary/30" />
                                            <div className="absolute inset-8 rounded-full border-4 border-primary/20" />
                                            <div className="absolute inset-12 rounded-full border-4 border-primary/10" />

                                            {/* Center Label */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-32 h-32 rounded-full bg-background border-4 border-secondary flex flex-col items-center justify-center gap-2">
                                                    <Music2 className="w-12 h-12 text-secondary" />
                                                    <span className="font-mono text-xs text-muted-foreground">BOOM</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tone Arm */}
                                    <div className={`absolute top-6 right-6 w-2 h-32 bg-secondary origin-top transition-transform duration-500 ${isPlaying ? 'rotate-[-25deg]' : 'rotate-0'}`}>
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-accent rounded-full" />
                                    </div>
                                </div>
                            </div>

                            {/* Track Info */}
                            <div className="text-center mb-6 border-t-4 border-border pt-6">
                                <h3 className="font-heading text-2xl mb-2">Track Title</h3>
                                <p className="font-mono text-sm text-muted-foreground">Artist Name • Album Name</p>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-4">
                                <button className="w-12 h-12 border-4 border-border flex items-center justify-center hover:border-foreground transition-colors">
                                    <SkipForward className="w-5 h-5 rotate-180" />
                                </button>
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-16 h-16 bg-primary border-4 border-primary flex items-center justify-center hover:bg-secondary hover:border-secondary transition-all"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-8 h-8 text-background" />
                                    ) : (
                                        <Play className="w-8 h-8 text-background ml-1" />
                                    )}
                                </button>
                                <button className="w-12 h-12 border-4 border-border flex items-center justify-center hover:border-foreground transition-colors">
                                    <SkipForward className="w-5 h-5" />
                                </button>
                                <button className="w-12 h-12 border-4 border-border flex items-center justify-center hover:border-foreground transition-colors">
                                    <Volume2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Live Activity */}
                        <div className="border-t-4 border-secondary pt-6">
                            <h2 className="font-heading text-4xl mb-6">Live Activity</h2>
                            <LiveFeed />
                        </div>
                    </div>

                    {/* Right Sidebar: Discovery */}
                    <div className="lg:col-span-3">
                        <div className="border-t-4 border-accent pt-4">
                            <h3 className="font-heading text-2xl mb-6">Discover</h3>
                            <DiscoveryFeed />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

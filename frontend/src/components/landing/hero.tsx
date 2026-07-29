"use client";

import { Music2, Radio, Disc3, Users2, Play, Pause } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function HeroSection() {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden border-b-4 border-border">
            {/* Oversized Background Typography */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                <h1 className="text-massive font-heading text-foreground">
                    MUSIC
                </h1>
            </div>

            <div className="container-asymmetric relative z-10 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Main Content */}
                    <div className="space-y-8">
                        {/* Eyebrow */}
                        <div className="stagger-item">
                            <div className="inline-block px-4 py-2 bg-accent/20 border-2 border-accent">
                                <p className="font-mono text-accent uppercase tracking-widest text-sm font-bold">
                                    Social Music Discovery
                                </p>
                            </div>
                        </div>

                        {/* Main Heading */}
                        <div className="stagger-item">
                            <h1 className="font-heading text-7xl md:text-8xl lg:text-9xl leading-none text-foreground mb-6">
                                Find Your
                                <span className="block font-display italic text-primary mt-2">
                                    Sound Tribe
                                </span>
                            </h1>
                        </div>

                        {/* Description */}
                        <div className="stagger-item border-l-4 border-primary pl-6">
                            <p className="font-mono text-foreground text-lg leading-relaxed">
                                Connect with people who vibe to the same tracks.
                                Broadcast live radio. Discover music through shared listening.
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="stagger-item flex flex-wrap gap-4 items-center">
                            <Link
                                href="/radio/new"
                                className="px-8 py-4 bg-primary text-background font-heading text-lg border-4 border-primary hover:bg-background hover:text-primary transition-all"
                            >
                                Start Broadcasting
                            </Link>

                            <Link
                                href="/radio"
                                className="px-8 py-4 border-4 border-foreground text-foreground font-heading text-lg hover:bg-foreground hover:text-background transition-all"
                            >
                                Explore Stations
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="stagger-item grid grid-cols-3 gap-8 pt-8 border-t-4 border-border">
                            <div className="border-l-4 border-primary pl-4">
                                <p className="font-mono text-4xl font-bold text-primary">12K+</p>
                                <p className="font-mono text-xs text-muted-foreground uppercase tracking-wide">Active DJs</p>
                            </div>
                            <div className="border-l-4 border-secondary pl-4">
                                <p className="font-mono text-4xl font-bold text-secondary">500+</p>
                                <p className="font-mono text-xs text-muted-foreground uppercase tracking-wide">Live Stations</p>
                            </div>
                            <div className="border-l-4 border-accent pl-4">
                                <p className="font-mono text-4xl font-bold text-accent">24/7</p>
                                <p className="font-mono text-xs text-muted-foreground uppercase tracking-wide">Broadcasting</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Improved Vinyl Player */}
                    <div className="relative">
                        <div className="stagger-item relative w-full max-w-lg mx-auto">
                            {/* Main Vinyl Container */}
                            <div className="relative aspect-square bg-muted border-4 border-border p-8">
                                {/* Vinyl Disc - Improved Design */}
                                <div className="relative w-full h-full">
                                    {/* Outer Ring */}
                                    <div className={`absolute inset-0 rounded-full border-8 border-primary transition-transform duration-1000 ${isPlaying ? 'animate-[vinyl-spin_3s_linear_infinite]' : ''}`}>
                                        {/* Grooves Effect */}
                                        <div className="absolute inset-4 rounded-full border-4 border-primary/30" />
                                        <div className="absolute inset-8 rounded-full border-4 border-primary/20" />
                                        <div className="absolute inset-12 rounded-full border-4 border-primary/10" />

                                        {/* Center Label */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-32 h-32 rounded-full bg-background border-4 border-secondary flex flex-col items-center justify-center gap-2">
                                                <Music2 className="w-12 h-12 text-secondary" />
                                                <span className="font-mono text-xs text-muted-foreground">FAM</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Play/Pause Control */}
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="absolute bottom-4 right-4 w-16 h-16 bg-accent border-4 border-background flex items-center justify-center hover:scale-110 transition-transform z-10"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-8 h-8 text-background" />
                                        ) : (
                                            <Play className="w-8 h-8 text-background ml-1" />
                                        )}
                                    </button>
                                </div>

                                {/* Tone Arm */}
                                <div className={`absolute top-8 right-8 w-2 h-32 bg-secondary origin-top transition-transform duration-500 ${isPlaying ? 'rotate-[-25deg]' : 'rotate-0'}`}>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-accent rounded-full" />
                                </div>
                            </div>

                            {/* Floating Stats */}
                            <div className="absolute -bottom-6 -left-6 bg-secondary border-4 border-background px-6 py-4">
                                <p className="font-mono text-2xl font-bold text-background">LIVE</p>
                            </div>
                            <div className="absolute -top-6 -right-6 bg-accent border-4 border-background px-6 py-4">
                                <p className="font-mono text-2xl font-bold text-background">24/7</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

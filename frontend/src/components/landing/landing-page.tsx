"use client";

import { HeroSection } from "./hero";
import { Music2, Radio, Disc, Users, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";

export function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground relative">
            {/* Top Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-xl border-b-2 border-border z-50">
                <div className="container-asymmetric h-full flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-primary flex items-center justify-center transition-transform group-hover:scale-110">
                            <Music2 className="w-6 h-6 text-background" />
                        </div>
                        <span className="font-heading text-2xl tracking-wider bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-bold">BOOMBOX</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/radio" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Stations
                        </Link>
                        <Link href="/discover" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Discover
                        </Link>
                        <Link href="/community" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Community
                        </Link>
                    </nav>

                    <Link
                        href="/login"
                        className="px-6 py-3 bg-primary text-background font-heading hover:bg-secondary transition-colors"
                    >
                        Get Started
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-20">
                <HeroSection />

                {/* Features Section - Clear Borders */}
                <section className="container-asymmetric py-32 relative z-10">
                    <div className="border-t-4 border-primary pt-16 mb-16">
                        <h2 className="font-heading text-6xl md:text-7xl mb-4">
                            Why BOOMBOX?
                        </h2>
                        <p className="font-mono text-muted-foreground text-lg max-w-2xl">
                            Not just another music app. A movement.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature Card 1 */}
                        <div className="bg-muted border-4 border-border p-8 space-y-4 hover:border-primary transition-colors">
                            <div className="w-16 h-16 bg-primary flex items-center justify-center">
                                <Radio className="w-8 h-8 text-background" />
                            </div>
                            <h3 className="font-heading text-2xl">Live Broadcasting</h3>
                            <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                                Start your own radio station. Share your taste. Build your audience.
                            </p>
                        </div>

                        {/* Feature Card 2 */}
                        <div className="bg-muted border-4 border-border p-8 space-y-4 hover:border-secondary transition-colors">
                            <div className="w-16 h-16 bg-secondary flex items-center justify-center">
                                <Users className="w-8 h-8 text-background" />
                            </div>
                            <h3 className="font-heading text-2xl">Social Discovery</h3>
                            <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                                Find people who vibe to the same tracks. Real connections through music.
                            </p>
                        </div>

                        {/* Feature Card 3 */}
                        <div className="bg-muted border-4 border-border p-8 space-y-4 hover:border-accent transition-colors">
                            <div className="w-16 h-16 bg-accent flex items-center justify-center">
                                <TrendingUp className="w-8 h-8 text-background" />
                            </div>
                            <h3 className="font-heading text-2xl">Real-Time Vibes</h3>
                            <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                                See what everyone's listening to. Join the conversation. Feel the energy.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="relative py-32 overflow-hidden border-y-4 border-primary">
                    <div className="absolute inset-0 bg-primary opacity-10" />

                    <div className="container-asymmetric relative z-10 text-center">
                        <h2 className="font-display text-6xl md:text-8xl text-foreground mb-8 italic">
                            Ready to Broadcast?
                        </h2>
                        <Link
                            href="/login"
                            className="inline-block px-12 py-6 bg-primary text-background font-heading text-xl hover:bg-secondary transition-colors border-4 border-primary hover:border-secondary"
                        >
                            Join the Movement
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t-4 border-border py-12">
                    <div className="container-asymmetric">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-3">
                                <Music2 className="w-6 h-6 text-primary" />
                                <span className="font-heading text-xl tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold">BOOMBOX</span>
                            </div>

                            <div className="flex gap-8">
                                <Link href="#" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    About
                                </Link>
                                <Link href="#" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Community
                                </Link>
                                <Link href="#" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Support
                                </Link>
                            </div>

                            <p className="font-mono text-xs text-muted-foreground">
                                © 2024 BOOMBOX
                            </p>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}

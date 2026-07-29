'use client';

import { AppHeader } from '@/components/app-header';
import { StationDiscoveryFeed } from '@/components/station-discovery-feed';
import { DJLeaderboard } from '@/components/dj-leaderboard';
import { Sparkles } from 'lucide-react';

/**
 * Discover Page
 *
 * Main discovery page for finding new stations and DJs
 */
export default function DiscoverPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white">
            <AppHeader />

            <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto pb-20">
                {/* Page Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Discover</h1>
                        <p className="text-muted-foreground">Find new stations, DJs, and music</p>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Station Discovery */}
                    <div className="lg:col-span-2">
                        <StationDiscoveryFeed />
                    </div>

                    {/* Sidebar - Leaderboard */}
                    <div>
                        <DJLeaderboard />
                    </div>
                </div>
            </div>
        </div>
    );
}

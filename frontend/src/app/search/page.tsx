'use client';

import { AppHeader } from '@/components/app-header';
import { SearchBar } from '@/components/search-bar';
import { Music2, TrendingUp } from 'lucide-react';

/**
 * Dedicated Search Page
 *
 * Full-screen search experience for mobile users
 */
export default function SearchPage() {
    const trendingSearches = [
        'Indie Rock',
        'Lo-fi Hip Hop',
        'Electronic',
        'Jazz',
        'Chill Vibes',
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white">
            <AppHeader />

            <div className="pt-24 px-4 md:px-8 max-w-4xl mx-auto pb-20">
                {/* Mobile-optimized search */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Search</h1>
                    <p className="text-muted-foreground">
                        Find music, friends, and stations
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <SearchBar />
                </div>

                {/* Trending Searches */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Trending</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trendingSearches.map((search) => (
                            <button
                                key={search}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm transition-colors"
                            >
                                {search}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Browse Categories */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Browse All</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {['Rock', 'Pop', 'Hip Hop', 'Electronic', 'Jazz', 'Classical'].map(
                            (category) => (
                                <div
                                    key={category}
                                    className="aspect-square bg-gradient-to-br from-primary/40 to-primary/20 rounded-xl p-6 flex items-end cursor-pointer hover:scale-105 transition-transform"
                                >
                                    <div className="flex items-center gap-2">
                                        <Music2 className="w-5 h-5" />
                                        <span className="font-semibold">{category}</span>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

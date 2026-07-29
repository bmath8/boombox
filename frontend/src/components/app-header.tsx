'use client';

import { Music2 } from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
import Link from 'next/link';

/**
 * App Header Component
 *
 * Global header with branding, search, and user menu
 */
export function AppHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 glass-dark border-b border-white/10 z-40">
            <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                    <div className="p-2 bg-primary/20 rounded-full">
                        <Music2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-bold text-xl tracking-wider hidden sm:inline bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        BOOMBOX
                    </span>
                </Link>

                {/* Search Bar */}
                <div className="flex-1 max-w-2xl">
                    <SearchBar />
                </div>

                {/* User Menu Placeholder */}
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">JD</span>
                </div>
            </div>
        </header>
    );
}

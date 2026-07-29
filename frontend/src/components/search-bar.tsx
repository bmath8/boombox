'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Music, Users as UsersIcon, Radio, ListMusic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type SearchResults = {
    tracks: any[];
    users: any[];
    stations: any[];
    playlists: any[];
};

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Global Search Bar Component
 *
 * Provides instant search across tracks, users, stations, and playlists.
 * Features:
 * - Debounced search (300ms)
 * - Keyboard navigation
 * - Click outside to close
 * - Keyboard shortcut (/) to focus
 */
export function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced search function
    const debouncedSearch = useMemo(
        () =>
            debounce(async (q: string) => {
                if (!q || q.trim().length === 0) {
                    setResults(null);
                    setLoading(false);
                    return;
                }

                setLoading(true);
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
                    const data = await res.json();
                    setResults(data);
                } catch (error) {
                    console.error('Search error:', error);
                    setResults(null);
                } finally {
                    setLoading(false);
                }
            }, 300),
        []
    );

    // Trigger search when query changes
    useEffect(() => {
        debouncedSearch(query);
    }, [query, debouncedSearch]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClear = () => {
        setQuery('');
        setResults(null);
        inputRef.current?.focus();
    };

    const totalResults =
        (results?.tracks.length || 0) +
        (results?.users.length || 0) +
        (results?.stations.length || 0) +
        (results?.playlists.length || 0);

    return (
        <div ref={searchRef} className="relative w-full max-w-2xl">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                    ref={inputRef}
                    type="search"
                    data-search-input
                    placeholder="Search music, friends, stations..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    className={cn(
                        'w-full h-12 pl-12 pr-12 rounded-xl',
                        'bg-white/5 border border-white/10',
                        'text-white placeholder:text-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
                        'transition-all duration-200'
                    )}
                    aria-label="Search"
                    aria-expanded={isOpen}
                    aria-controls="search-results"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
                {isOpen && query && (
                    <motion.div
                        id="search-results"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            'absolute top-full mt-2 w-full',
                            'glass-dark rounded-xl border border-white/10 shadow-2xl',
                            'max-h-[500px] overflow-y-auto',
                            'z-50'
                        )}
                        role="listbox"
                        aria-label="Search results"
                    >
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-sm">Searching...</p>
                            </div>
                        ) : results && totalResults > 0 ? (
                            <div className="p-2">
                                {/* Tracks */}
                                {results.tracks.length > 0 && (
                                    <SearchSection
                                        title="Tracks"
                                        icon={<Music className="w-4 h-4" />}
                                        items={results.tracks.map((track) => ({
                                            id: track.id,
                                            title: track.name,
                                            subtitle: track.artists.map((a: any) => a.name).join(', '),
                                            image: track.album.images[0]?.url,
                                            href: track.external_urls.spotify,
                                        }))}
                                    />
                                )}

                                {/* Users */}
                                {results.users.length > 0 && (
                                    <SearchSection
                                        title="Users"
                                        icon={<UsersIcon className="w-4 h-4" />}
                                        items={results.users.map((user) => ({
                                            id: user.user_id,
                                            title: user.display_name,
                                            subtitle: 'User',
                                            image: user.avatar_url,
                                            href: `/profile/${user.user_id}`,
                                        }))}
                                    />
                                )}

                                {/* Stations */}
                                {results.stations.length > 0 && (
                                    <SearchSection
                                        title="Stations"
                                        icon={<Radio className="w-4 h-4" />}
                                        items={results.stations.map((station) => ({
                                            id: station.station_id,
                                            title: station.station_name,
                                            subtitle: `${station.listener_count} listening`,
                                            href: `/radio/${station.station_id}`,
                                        }))}
                                    />
                                )}

                                {/* Playlists */}
                                {results.playlists.length > 0 && (
                                    <SearchSection
                                        title="Playlists"
                                        icon={<ListMusic className="w-4 h-4" />}
                                        items={results.playlists.map((playlist) => ({
                                            id: playlist.playlist_id,
                                            title: playlist.playlist_name,
                                            subtitle: `${playlist.total_tracks} tracks`,
                                            href: `/playlists/${playlist.playlist_id}`,
                                        }))}
                                    />
                                )}
                            </div>
                        ) : query && !loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No results found for "{query}"</p>
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Search section component
function SearchSection({
    title,
    icon,
    items,
}: {
    title: string;
    icon: React.ReactNode;
    items: Array<{
        id: string;
        title: string;
        subtitle: string;
        image?: string;
        href: string;
    }>;
}) {
    return (
        <div className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {icon}
                {title}
            </div>
            <div className="space-y-1">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg',
                            'hover:bg-white/10 transition-colors',
                            'group'
                        )}
                        role="option"
                    >
                        {item.image ? (
                            <img
                                src={item.image}
                                alt={item.title}
                                className="w-10 h-10 rounded object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center">
                                {icon}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
                                {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {item.subtitle}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

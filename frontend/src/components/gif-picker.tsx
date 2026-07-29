'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, Loader2, X, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/use-debounce';

interface GifResult {
    id: string;
    url: string;
    preview: string;
    title: string;
}

interface GifPickerProps {
    onSelect: (gif: GifResult) => void;
    onClose: () => void;
}

// Tenor API key - must be configured in .env.local
const TENOR_API_KEY = process.env['NEXT_PUBLIC_TENOR_API_KEY'];

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GifResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [trending, setTrending] = useState<GifResult[]>([]);
    const [isConfigured, setIsConfigured] = useState(true);

    const debouncedQuery = useDebounce(query, 300);

    // Fetch trending on mount
    useEffect(() => {
        if (!TENOR_API_KEY) {
            setIsConfigured(false);
            return;
        }
        fetchTrending();
    }, []);

    const fetchTrending = async () => {
        if (!TENOR_API_KEY) return;
        try {
            const response = await fetch(
                `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif,tinygif`
            );
            const data = await response.json();

            setTrending(data.results.map((gif: {
                id: string;
                media_formats: {
                    gif: { url: string };
                    tinygif: { url: string };
                };
                title: string;
            }) => ({
                id: gif.id,
                url: gif.media_formats.gif.url,
                preview: gif.media_formats.tinygif.url,
                title: gif.title
            })));
        } catch (error) {
            console.error('Failed to fetch trending GIFs:', error);
        }
    };

    const searchGifs = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || !TENOR_API_KEY) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=20&media_filter=gif,tinygif`
            );
            const data = await response.json();

            setResults(data.results.map((gif: {
                id: string;
                media_formats: {
                    gif: { url: string };
                    tinygif: { url: string };
                };
                title: string;
            }) => ({
                id: gif.id,
                url: gif.media_formats.gif.url,
                preview: gif.media_formats.tinygif.url,
                title: gif.title
            })));
        } catch (error) {
            console.error('Failed to search GIFs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Search when query changes
    useEffect(() => {
        if (debouncedQuery) {
            searchGifs(debouncedQuery);
        }
    }, [debouncedQuery, searchGifs]);

    const displayGifs = query ? results : trending;

    // Not configured state
    if (!isConfigured) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-black/95 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 p-6"
            >
                <div className="flex flex-col items-center justify-center text-center">
                    <Image className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">GIF Picker not configured</p>
                    <p className="text-xs text-muted-foreground/60">Add NEXT_PUBLIC_TENOR_API_KEY to .env.local</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
                        Close
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-black/95 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
            style={{ maxHeight: '400px' }}
        >
            {/* Header */}
            <div className="p-3 border-b border-white/10 flex items-center gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search GIFs..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        autoFocus
                    />
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>

            {/* Content */}
            <div className="p-2 overflow-y-auto" style={{ maxHeight: '300px' }}>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : displayGifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Image className="w-8 h-8 mb-2" />
                        <p className="text-sm">{query ? 'No GIFs found' : 'Search for GIFs'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-1">
                        {displayGifs.map((gif) => (
                            <motion.button
                                key={gif.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onSelect(gif)}
                                className="aspect-square rounded-lg overflow-hidden bg-white/5 hover:ring-2 hover:ring-primary transition-all"
                            >
                                <img
                                    src={gif.preview}
                                    alt={gif.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-white/10 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Powered by Tenor</span>
            </div>
        </motion.div>
    );
}

// Hook for debouncing
function useDebounceInternal<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useState(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    });

    return debouncedValue;
}

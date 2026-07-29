'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    History, Clock, Play, Heart, Trash2, Calendar,
    ChevronDown, Filter, Music, Radio
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/error-handler';
import { LoadingState } from '@/components/ui/loading-state';

interface ListeningHistoryItem {
    id: string;
    track_name: string;
    artist_name: string;
    album_art: string | undefined;
    played_at: string;
    duration_ms: number;
    station_name: string | undefined;
    station_id: string | undefined;
    source: 'spotify' | 'radio' | 'playlist';
}

type TimeFilter = 'today' | 'week' | 'month' | 'all';
type SourceFilter = 'all' | 'spotify' | 'radio' | 'playlist';

export function ListeningHistory() {
    const [history, setHistory] = useState<ListeningHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [stats, setStats] = useState({
        totalTracks: 0,
        totalTime: 0,
        topArtist: '',
        topStation: ''
    });

    useEffect(() => {
        fetchHistory();
    }, [timeFilter, sourceFilter]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Calculate date filter
            let dateFilter = new Date();
            switch (timeFilter) {
                case 'today':
                    dateFilter.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    dateFilter.setDate(dateFilter.getDate() - 7);
                    break;
                case 'month':
                    dateFilter.setMonth(dateFilter.getMonth() - 1);
                    break;
                case 'all':
                    dateFilter = new Date(0);
                    break;
            }

            // Fetch listening history
            let query = supabase
                .from('listening_history')
                .select(`
                    *,
                    radio_stations (
                        station_name
                    )
                `)
                .eq('user_id', user.id)
                .gte('played_at', dateFilter.toISOString())
                .order('played_at', { ascending: false })
                .limit(100);

            if (sourceFilter !== 'all') {
                query = query.eq('source', sourceFilter);
            }

            const { data, error } = await query;

            if (error) throw error;

            const formattedHistory: ListeningHistoryItem[] = (data || []).map((item: {
                id: string;
                track_name: string;
                artist_name: string;
                album_art_url?: string;
                played_at: string;
                duration_ms: number;
                station_id?: string;
                source: 'spotify' | 'radio' | 'playlist';
                radio_stations?: { station_name: string };
            }) => ({
                id: item.id,
                track_name: item.track_name,
                artist_name: item.artist_name,
                album_art: item.album_art_url,
                played_at: item.played_at,
                duration_ms: item.duration_ms || 0,
                station_name: item.radio_stations?.station_name,
                station_id: item.station_id,
                source: item.source
            }));

            setHistory(formattedHistory);
            calculateStats(formattedHistory);

        } catch (error) {
            handleError(error, 'ListeningHistory');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (items: ListeningHistoryItem[]) => {
        const totalTime = items.reduce((acc, item) => acc + item.duration_ms, 0);

        // Count artists
        const artistCounts = new Map<string, number>();
        items.forEach(item => {
            artistCounts.set(item.artist_name, (artistCounts.get(item.artist_name) || 0) + 1);
        });
        const topArtist = [...artistCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Count stations
        const stationCounts = new Map<string, number>();
        items.filter(item => item.station_name).forEach(item => {
            stationCounts.set(item.station_name!, (stationCounts.get(item.station_name!) || 0) + 1);
        });
        const topStation = [...stationCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        setStats({
            totalTracks: items.length,
            totalTime,
            topArtist,
            topStation
        });
    };

    const formatDuration = (ms: number): string => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'radio':
                return <Radio className="w-3 h-3" />;
            case 'playlist':
                return <Music className="w-3 h-3" />;
            default:
                return <Music className="w-3 h-3" />;
        }
    };

    const clearHistory = async () => {
        if (!confirm('Clear all listening history?')) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('listening_history')
                .delete()
                .eq('user_id', user.id);

            setHistory([]);
            setStats({ totalTracks: 0, totalTime: 0, topArtist: '', topStation: '' });
        } catch (error) {
            handleError(error, 'ClearHistory');
        }
    };

    return (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        Listening History
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <Filter className="w-4 h-4 text-white" />
                        </button>
                        <button
                            onClick={clearHistory}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-red-400"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="p-2 bg-white/5 rounded-lg text-center">
                        <p className="text-lg font-bold text-white">{stats.totalTracks}</p>
                        <p className="text-xs text-muted-foreground">Tracks</p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg text-center">
                        <p className="text-lg font-bold text-white">{formatDuration(stats.totalTime)}</p>
                        <p className="text-xs text-muted-foreground">Time</p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg text-center">
                        <p className="text-sm font-bold text-white truncate">{stats.topArtist}</p>
                        <p className="text-xs text-muted-foreground">Top Artist</p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg text-center">
                        <p className="text-sm font-bold text-white truncate">{stats.topStation}</p>
                        <p className="text-xs text-muted-foreground">Top Station</p>
                    </div>
                </div>

                {/* Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex gap-2 flex-wrap"
                        >
                            <div className="flex bg-white/5 rounded-lg p-1">
                                {(['today', 'week', 'month', 'all'] as TimeFilter[]).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTimeFilter(t)}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${timeFilter === t
                                            ? 'bg-primary text-white'
                                            : 'text-muted-foreground hover:text-white'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <div className="flex bg-white/5 rounded-lg p-1">
                                {(['all', 'spotify', 'radio', 'playlist'] as SourceFilter[]).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setSourceFilter(s)}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${sourceFilter === s
                                            ? 'bg-primary text-white'
                                            : 'text-muted-foreground hover:text-white'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <LoadingState variant="skeleton" />
                ) : history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No listening history yet</p>
                        <p className="text-xs mt-1">Start listening to build your history!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {history.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                                >
                                    {/* Album Art */}
                                    <div className="w-10 h-10 rounded overflow-hidden bg-white/10 flex-shrink-0 relative">
                                        {item.album_art ? (
                                            <img src={item.album_art} alt={item.track_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Music className="w-5 h-5 text-white/30" />
                                            </div>
                                        )}
                                        <button className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play className="w-4 h-4 text-white" />
                                        </button>
                                    </div>

                                    {/* Track Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{item.track_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{item.artist_name}</p>
                                    </div>

                                    {/* Source & Time */}
                                    <div className="text-right flex-shrink-0">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                            {getSourceIcon(item.source)}
                                            {item.station_name && (
                                                <span className="truncate max-w-20">{item.station_name}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(item.played_at)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

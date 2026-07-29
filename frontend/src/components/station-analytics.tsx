'use client';

import { useEffect, useState } from 'react';
import { useRadio } from '@/lib/radio-station';
import { supabase } from '@/lib/supabase';
import { BarChart3, Users, Clock, TrendingUp } from 'lucide-react';
import { cachedFetch, cacheKey } from '@/lib/cache';
import { handleError } from '@/lib/error-handler';
import { LoadingState } from '@/components/ui/loading-state';

export function StationAnalytics() {
    const { currentStation, isBroadcasting } = useRadio();
    const [analytics, setAnalytics] = useState({
        peakListeners: 0,
        avgListenTime: '0m',
        engagementRate: '0%',
        totalReactions: 0,
        totalMessages: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentStation || !isBroadcasting) return;

        const fetchAnalytics = async () => {
            try {
                const data = await cachedFetch(
                    cacheKey('station-analytics', currentStation.station_id),
                    async () => {
                        // 1. Get Peak Listeners from station record
                        const { data: stationData, error: stationError } = await supabase
                            .from('radio_stations')
                            .select('peak_listeners, listener_count')
                            .eq('station_id', currentStation.station_id)
                            .single();

                        if (stationError) throw stationError;

                        // 2. Get Engagement (Reactions + Messages)
                        const { count: reactionCount, error: reactionError } = await supabase
                            .from('reactions')
                            .select('*', { count: 'exact', head: true })
                            .eq('station_id', currentStation.station_id);

                        if (reactionError) throw reactionError;

                        const { count: messageCount, error: messageError } = await supabase
                            .from('radio_chat_messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('station_id', currentStation.station_id);

                        if (messageError) throw messageError;

                        const totalEngagements = (reactionCount || 0) + (messageCount || 0);
                        const peak = stationData?.peak_listeners || currentStation.listener_count || 1;

                        // Simple engagement rate calc: (Total Interactions / Peak Listeners) * 100
                        // Cap at 100% for sanity
                        const engagementRate = Math.min(Math.round((totalEngagements / Math.max(peak, 1)) * 100), 100);

                        // 3. Calculate Average Listen Time from sessions
                        let avgListenTime = 'No data';
                        try {
                            // Try to get session data if the table exists
                            const { data: sessions } = await supabase
                                .from('listener_sessions')
                                .select('duration_seconds')
                                .eq('station_id', currentStation.station_id)
                                .not('duration_seconds', 'is', null)
                                .limit(100);

                            if (sessions && sessions.length > 0) {
                                const totalSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
                                const avgSeconds = Math.round(totalSeconds / sessions.length);
                                const mins = Math.floor(avgSeconds / 60);
                                const secs = avgSeconds % 60;
                                avgListenTime = `${mins}m ${secs}s`;
                            }
                        } catch {
                            // Table doesn't exist yet, calculate estimate from station lifetime
                            const wentLiveAt = currentStation.went_live_at;
                            if (wentLiveAt) {
                                const durationMs = Date.now() - new Date(wentLiveAt).getTime();
                                const durationMins = Math.floor(durationMs / 60000);
                                // Estimate: if station has been live for X mins with Y current listeners
                                // estimate avg is somewhere between 30% to 70% of that
                                const estimatedMins = Math.max(1, Math.floor(durationMins * 0.5));
                                avgListenTime = `~${estimatedMins}m`;
                            }
                        }

                        return {
                            peakListeners: peak,
                            avgListenTime,
                            engagementRate: `${engagementRate}%`,
                            totalReactions: reactionCount || 0,
                            totalMessages: messageCount || 0
                        };
                    },
                    30000 // 30 seconds TTL
                );

                setAnalytics(data);
            } catch (error) {
                handleError(error, 'Station Analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();

        // Refresh every 30s
        const interval = setInterval(fetchAnalytics, 30000);
        return () => clearInterval(interval);
    }, [currentStation, isBroadcasting]);

    if (!isBroadcasting || !currentStation) return null;

    if (loading) {
        return (
            <div className="glass-dark rounded-2xl p-6 border border-white/5 mt-6">
                <LoadingState variant="skeleton" />
            </div>
        );
    }

    return (
        <div className="glass-dark rounded-2xl p-6 border border-white/5 mt-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Station Analytics
                </h3>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-white/5 rounded">Live Data</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Peak Listeners</span>
                    </div>
                    <div className="text-2xl font-bold">{analytics.peakListeners}</div>
                    <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3" />
                        Live
                    </div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Avg. Listen Time</span>
                    </div>
                    <div className="text-2xl font-bold">{analytics.avgListenTime}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        Est. based on sessions
                    </div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Engagement Rate</span>
                    </div>
                    <div className="text-2xl font-bold">{analytics.engagementRate}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {analytics.totalReactions} reactions • {analytics.totalMessages} msgs
                    </div>
                </div>
            </div>
        </div>
    );
}

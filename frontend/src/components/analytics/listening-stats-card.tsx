'use client';

import { useListeningStats } from '@/hooks/queries/use-analytics';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Music, TrendingUp, TrendingDown } from 'lucide-react';
import type { ListeningStats } from '@/types/analytics';

interface ListeningStatsCardProps {
    period?: string;
}

export function ListeningStatsCard({ period = 'month' }: ListeningStatsCardProps) {
    const { data: stats, isLoading } = useListeningStats(period);

    if (isLoading) {
        return <ListeningStatsCardSkeleton />;
    }

    if (!stats) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                label="Listening Time"
                value={`${Math.floor(stats.total_listening_time / 60)}h ${
                    stats.total_listening_time % 60
                }m`}
                change={stats.listening_time_change}
                icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
                label="Tracks Played"
                value={stats.total_tracks_played.toLocaleString()}
                change={stats.tracks_played_change}
                icon={<Music className="h-5 w-5" />}
            />
            <StatCard
                label="Unique Artists"
                value={stats.unique_artists.toLocaleString()}
                icon={<Music className="h-5 w-5" />}
            />
            <StatCard
                label="Avg. Session"
                value={`${Math.floor(stats.avg_session_length)} min`}
                icon={<Clock className="h-5 w-5" />}
            />
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string;
    change?: number;
    icon: React.ReactNode;
}

function StatCard({ label, value, change, icon }: StatCardProps) {
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="text-muted-foreground">{icon}</div>
            </div>
            <div className="text-2xl font-bold">{value}</div>
            {change !== undefined && (
                <div
                    className={`flex items-center gap-1 text-sm mt-1 ${
                        change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                >
                    {change >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                    ) : (
                        <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{Math.abs(change).toFixed(1)}% vs last period</span>
                </div>
            )}
        </Card>
    );
}

function ListeningStatsCardSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-28 mt-2" />
                </Card>
            ))}
        </div>
    );
}

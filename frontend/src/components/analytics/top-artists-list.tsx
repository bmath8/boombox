'use client';

import { useArtistInsights } from '@/hooks/queries/use-analytics';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TopArtistsListProps {
    period?: string;
    limit?: number;
}

export function TopArtistsList({ period, limit = 10 }: TopArtistsListProps) {
    const { data: artists, isLoading } = useArtistInsights({ period: period || 'month', limit });

    if (isLoading) {
        return <TopArtistsListSkeleton />;
    }

    if (!artists || artists.length === 0) {
        return (
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Top Artists
                </h3>
                <div className="p-8 text-center">
                    <p className="text-muted-foreground">No artist data available</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Music className="h-5 w-5" />
                Top Artists
            </h3>

            <div className="space-y-4">
                {artists.map((artist: any, index: number) => (
                    <div
                        key={artist.artist_id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                        {/* Rank */}
                        <div className="text-2xl font-bold text-muted-foreground w-8">
                            {index + 1}
                        </div>

                        {/* Artist Image */}
                        <div className="h-14 w-14 rounded-full bg-secondary flex-shrink-0 overflow-hidden">
                            {artist.image_url && (
                                <img
                                    src={artist.image_url}
                                    alt={artist.artist_name}
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </div>

                        {/* Artist Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">
                                {artist.artist_name}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                                {artist.total_plays} plays •{' '}
                                {Math.floor(artist.listening_time / 60)}h{' '}
                                {artist.listening_time % 60}m
                            </div>
                            {artist.unique_tracks_played && (
                                <div className="text-xs text-muted-foreground">
                                    {artist.unique_tracks_played} tracks
                                </div>
                            )}
                        </div>

                        {/* Trend Indicator */}
                        <div className="flex-shrink-0">
                            {artist.trend === 'rising' && (
                                <div className="flex items-center gap-1 text-green-600">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-xs">Rising</span>
                                </div>
                            )}
                            {artist.trend === 'falling' && (
                                <div className="flex items-center gap-1 text-red-600">
                                    <TrendingDown className="h-4 w-4" />
                                    <span className="text-xs">Falling</span>
                                </div>
                            )}
                            {artist.trend === 'stable' && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Minus className="h-4 w-4" />
                                    <span className="text-xs">Stable</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function TopArtistsListSkeleton() {
    return (
        <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

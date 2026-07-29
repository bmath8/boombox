'use client';

import { useGenreDistribution } from '@/hooks/queries/use-analytics';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Music } from 'lucide-react';

interface GenreDistributionChartProps {
    period?: string;
}

const COLORS = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
];

export function GenreDistributionChart({ period }: GenreDistributionChartProps) {
    const { data: genres, isLoading } = useGenreDistribution(period);

    if (isLoading) {
        return <GenreDistributionChartSkeleton />;
    }

    if (!genres || genres.length === 0) {
        return (
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Genre Distribution
                </h3>
                <div className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">No genre data available</p>
                </div>
            </Card>
        );
    }

    // Top 8 genres + "Other"
    const topGenres = genres.slice(0, 8);
    const otherGenres = genres.slice(8);
    const otherPercentage = otherGenres.reduce((sum, g) => sum + g.percentage, 0);

    const chartData = [
        ...topGenres.map((g) => ({
            name: g.genre,
            value: g.percentage,
            playCount: g.play_count,
        })),
        ...(otherGenres.length > 0
            ? [
                {
                    name: 'Other',
                    value: otherPercentage,
                    playCount: otherGenres.reduce((sum, g) => sum + g.play_count, 0),
                },
            ]
            : []),
    ];

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Music className="h-5 w-5" />
                Genre Distribution
            </h3>

            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name} (${entry.value.toFixed(1)}%)`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number, name, props) => [
                            `${value.toFixed(1)}% (${props.payload.playCount} plays)`,
                            name,
                        ]}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>

            {/* Genre List */}
            <div className="mt-6 space-y-2">
                {genres.slice(0, 5).map((genre, index) => (
                    <div key={genre.genre} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{genre.genre}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {genre.play_count} plays •{' '}
                            {Math.floor(genre.listening_time / 60)}h
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export function GenreDistributionChartSkeleton() {
    return (
        <Card className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-80 w-full" />
        </Card>
    );
}

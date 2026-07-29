'use client';

import { useListeningTrends } from '@/hooks/queries/use-analytics';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface ListeningTrendsChartProps {
    period?: 'week' | 'month' | 'year';
}

export function ListeningTrendsChart({
    period = 'month',
}: ListeningTrendsChartProps) {
    const { data: trends, isLoading } = useListeningTrends(period);

    if (isLoading) {
        return <ListeningTrendsChartSkeleton />;
    }

    if (!trends || !trends.data || trends.data.length === 0) {
        return (
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Listening Trends
                </h3>
                <div className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">No trend data available</p>
                </div>
            </Card>
        );
    }

    const chartData = trends.data.map((item) => ({
        date: format(new Date(item.date), 'MMM dd'),
        fullDate: item.date,
        value: item.value,
    }));

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Listening Trends
                <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Last {period})
                </span>
            </h3>

            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickMargin={10}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickMargin={10} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                        }}
                        formatter={(value: number) => [`${value} minutes`, 'Listening Time']}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}

export function ListeningTrendsChartSkeleton() {
    return (
        <Card className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-80 w-full" />
        </Card>
    );
}

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Calendar } from 'lucide-react';
import { ListeningStatsCard } from './listening-stats-card';
import dynamic from 'next/dynamic';
import { ListeningTrendsChartSkeleton } from './listening-trends-chart';
import { GenreDistributionChartSkeleton } from './genre-distribution-chart';

const GenreDistributionChart = dynamic(
    () => import('./genre-distribution-chart').then((mod) => mod.GenreDistributionChart),
    { loading: () => <GenreDistributionChartSkeleton /> }
);

const ListeningTrendsChart = dynamic(
    () => import('./listening-trends-chart').then((mod) => mod.ListeningTrendsChart),
    { loading: () => <ListeningTrendsChartSkeleton /> }
);
import { TopArtistsList } from './top-artists-list';
import { useMilestones } from '@/hooks/queries/use-analytics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type PeriodType = 'week' | 'month' | 'year' | 'all_time';

export function AnalyticsDashboard() {
    const [period, setPeriod] = useState<PeriodType>('month');
    const { data: milestones } = useMilestones();

    const handleExport = async () => {
        // Export analytics data
        try {
            const response = await fetch('/api/analytics/export?format=json');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
            a.click();
        } catch (error) {
            console.error('Failed to export analytics:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Your Music Analytics</h1>
                    <p className="text-muted-foreground mt-1">
                        Insights into your listening habits and preferences
                    </p>
                </div>
                <Button onClick={handleExport} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                </Button>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex gap-2">
                    <Button
                        variant={period === 'week' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPeriod('week')}
                    >
                        This Week
                    </Button>
                    <Button
                        variant={period === 'month' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPeriod('month')}
                    >
                        This Month
                    </Button>
                    <Button
                        variant={period === 'year' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPeriod('year')}
                    >
                        This Year
                    </Button>
                    <Button
                        variant={period === 'all_time' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPeriod('all_time')}
                    >
                        All Time
                    </Button>
                </div>
            </div>

            {/* Milestones */}
            {milestones && milestones.length > 0 && (
                <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
                    <h3 className="font-semibold mb-3">Recent Achievements</h3>
                    <div className="flex flex-wrap gap-2">
                        {milestones.slice(0, 5).map((milestone) => (
                            <Badge key={milestone.type} variant="secondary">
                                {milestone.description}
                            </Badge>
                        ))}
                    </div>
                </Card>
            )}

            {/* Stats Cards */}
            <ListeningStatsCard period={period} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ListeningTrendsChart period={period === 'all_time' ? 'year' : period} />
                <GenreDistributionChart period={period} />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="artists" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="artists">Top Artists</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="compare">Compare</TabsTrigger>
                </TabsList>

                <TabsContent value="artists" className="space-y-6">
                    <TopArtistsList period={period} limit={20} />
                </TabsContent>

                <TabsContent value="insights" className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Listening Insights
                        </h3>
                        <p className="text-muted-foreground">
                            Advanced insights coming soon...
                        </p>
                    </Card>
                </TabsContent>

                <TabsContent value="compare" className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Compare with Friends
                        </h3>
                        <p className="text-muted-foreground">
                            Social comparison features coming soon...
                        </p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

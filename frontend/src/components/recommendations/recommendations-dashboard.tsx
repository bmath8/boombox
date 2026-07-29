'use client';

import { usePersonalizedRecommendations, useDailyMixes, useDiscoverWeekly } from '@/hooks/queries/use-recommendations';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Music, TrendingUp, Users } from 'lucide-react';

export function RecommendationsDashboard() {
    const { data: personalized, isLoading: personalizedLoading } = usePersonalizedRecommendations();
    const { data: dailyMixes, isLoading: mixesLoading } = useDailyMixes();
    const { data: discoverWeekly, isLoading: discoverLoading } = useDiscoverWeekly();

    if (personalizedLoading || mixesLoading || discoverLoading) {
        return <RecommendationsDashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Sparkles className="h-8 w-8 text-primary" />
                        Discover
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Personalized music recommendations just for you
                    </p>
                </div>
            </div>

            <Tabs defaultValue="for-you" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="for-you">For You</TabsTrigger>
                    <TabsTrigger value="mood">By Mood</TabsTrigger>
                    <TabsTrigger value="friends">From Friends</TabsTrigger>
                    <TabsTrigger value="new">New Releases</TabsTrigger>
                </TabsList>

                <TabsContent value="for-you" className="space-y-6">
                    {/* Discover Weekly */}
                    {discoverWeekly && (
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Music className="h-5 w-5" />
                                Discover Weekly
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                Fresh tracks picked just for you, updated every Monday
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {discoverWeekly.tracks.slice(0, 10).map((track) => (
                                    <div key={track.id} className="space-y-2">
                                        <div className="aspect-square bg-secondary rounded-lg overflow-hidden">
                                            {track.image_url && (
                                                <img
                                                    src={track.image_url}
                                                    alt={track.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium truncate">{track.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Daily Mixes */}
                    {dailyMixes && dailyMixes.length > 0 && (
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Daily Mixes
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                Mixes made for you, based on your listening habits
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {dailyMixes.slice(0, 6).map((mix) => (
                                    <Card key={mix.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                                        <div className="aspect-square bg-secondary rounded-lg mb-3 overflow-hidden">
                                            {mix.image_url && (
                                                <img
                                                    src={mix.image_url}
                                                    alt={mix.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <h3 className="font-semibold">{mix.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                            {mix.description}
                                        </p>
                                    </Card>
                                ))}
                            </div>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="mood">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Music for Every Mood</h2>
                        <p className="text-muted-foreground">Coming soon...</p>
                    </Card>
                </TabsContent>

                <TabsContent value="friends">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            What Your Friends Are Listening To
                        </h2>
                        <p className="text-muted-foreground">Coming soon...</p>
                    </Card>
                </TabsContent>

                <TabsContent value="new">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">New Releases For You</h2>
                        <p className="text-muted-foreground">Coming soon...</p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function RecommendationsDashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-10 w-full max-w-md" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="aspect-square" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                    </div>
                ))}
            </div>
        </div>
    );
}

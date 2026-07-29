'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { ListeningHistory } from '@/components/listening-history';
import { DJLeaderboard } from '@/components/dj-leaderboard';
import { FollowButton, useFollowCounts } from '@/components/follow-button';
import { Music2, Radio, ListMusic, Settings, User, History, Trophy, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/ui/loading-state';

interface UserProfile {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    email: string;
}

/**
 * Profile Page
 *
 * User profile with stats, listening history, and DJ leaderboard
 */
export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'history' | 'leaderboard'>('history');
    const { followers, following } = useFollowCounts(user?.userId || '');

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                setUser({
                    userId: authUser.id,
                    displayName: authUser.user_metadata?.['display_name'] || 'User',
                    avatarUrl: authUser.user_metadata?.['avatar_url'] || null,
                    email: authUser.email || ''
                });
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white">
                <AppHeader />
                <div className="pt-24 flex items-center justify-center">
                    <LoadingState />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white">
            <AppHeader />

            <div className="pt-24 px-4 md:px-8 max-w-6xl mx-auto pb-20">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-bold">{user?.displayName?.[0] || 'U'}</span>
                        )}
                        <button className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 className="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-2xl font-bold mb-1">{user?.displayName || 'Guest User'}</h1>
                        <p className="text-muted-foreground mb-4">{user?.email || 'Not logged in'}</p>

                        {/* Stats Row */}
                        <div className="flex gap-6 justify-center md:justify-start">
                            <div className="text-center">
                                <div className="text-xl font-bold text-primary">{following}</div>
                                <div className="text-xs text-muted-foreground">Following</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-primary">{followers}</div>
                                <div className="text-xs text-muted-foreground">Followers</div>
                            </div>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                    <button
                        onClick={() => setActiveSection('history')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeSection === 'history'
                            ? 'bg-primary text-white'
                            : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <History className="w-4 h-4" />
                        Listening History
                    </button>
                    <button
                        onClick={() => setActiveSection('leaderboard')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeSection === 'leaderboard'
                            ? 'bg-primary text-white'
                            : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <Trophy className="w-4 h-4" />
                        DJ Leaderboard
                    </button>
                </div>

                {/* Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {activeSection === 'history' && <ListeningHistory />}
                        {activeSection === 'leaderboard' && <DJLeaderboard />}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

                        <button className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                            <Music2 className="w-5 h-5 text-primary" />
                            <span className="font-medium">My Music</span>
                        </button>

                        <button className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                            <Radio className="w-5 h-5 text-primary" />
                            <span className="font-medium">Start Broadcasting</span>
                        </button>

                        <button className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                            <ListMusic className="w-5 h-5 text-primary" />
                            <span className="font-medium">Saved Playlists</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


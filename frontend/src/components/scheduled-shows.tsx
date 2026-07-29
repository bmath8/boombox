'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Bell, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type Show = {
    id: string;
    title: string;
    host_id: string;
    start_time: string;
    description: string;
    host_name?: string;
};

export function ScheduledShows() {
    const [shows, setShows] = useState<Show[]>([]);
    const [isScheduling, setIsScheduling] = useState(false);
    const [newShow, setNewShow] = useState({
        title: '',
        description: '',
        startTime: '',
    });

    // Fetch shows
    useEffect(() => {
        const fetchShows = async () => {
            const { data } = await supabase
                .from('scheduled_shows')
                .select(`
                    *,
                    users (display_name)
                `)
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(6);

            if (data) {
                // Type for Supabase show response
                interface ShowData {
                    id: string;
                    title: string;
                    host_id: string;
                    start_time: string;
                    description: string;
                    users?: {
                        display_name: string;
                    };
                }

                const mappedShows = (data as unknown as ShowData[]).map((show) => ({
                    ...show,
                    host_name: show.users?.display_name || 'Unknown Host'
                }));
                setShows(mappedShows);
            }
        };

        fetchShows();

        // Real-time updates
        const channel = supabase
            .channel('public:scheduled_shows')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'scheduled_shows' }, fetchShows)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('scheduled_shows')
            .insert({
                title: newShow.title,
                description: newShow.description,
                start_time: new Date(newShow.startTime).toISOString(),
                host_id: user.id,
            });

        if (!error) {
            setIsScheduling(false);
            setNewShow({ title: '', description: '', startTime: '' });
        }
    };

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Upcoming Shows
                </h2>
                <button
                    onClick={() => setIsScheduling(true)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    Schedule a Show
                </button>
            </div>

            {/* Shows Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shows.length > 0 ? (
                    shows.map((show) => (
                        <motion.div
                            key={show.id}
                            whileHover={{ y: -2 }}
                            className="glass-dark p-4 rounded-xl border border-white/5 flex flex-col"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-bold text-white">{show.title}</h3>
                                    <p className="text-sm text-muted-foreground">by {show.host_name}</p>
                                </div>
                                <div className="px-2 py-1 bg-white/5 rounded text-xs font-medium text-white/80 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(show.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            <p className="text-sm text-white/60 mb-4 flex-1 line-clamp-2">
                                {show.description}
                            </p>

                            <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                <Bell className="w-4 h-4" />
                                Remind Me
                            </button>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground bg-white/5 rounded-xl border border-white/5 border-dashed">
                        No upcoming shows scheduled. Be the first!
                    </div>
                )}
            </div>

            {/* Schedule Modal */}
            <AnimatePresence>
                {isScheduling && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Schedule a Show</h3>
                                <button onClick={() => setIsScheduling(false)} className="p-2 hover:bg-white/10 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSchedule} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Show Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newShow.title}
                                        onChange={(e) => setNewShow({ ...newShow, title: e.target.value })}
                                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-primary"
                                        placeholder="e.g. Friday Night Jams"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                    <textarea
                                        required
                                        value={newShow.description}
                                        onChange={(e) => setNewShow({ ...newShow, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-primary h-24 resize-none"
                                        placeholder="What kind of music will you play?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={newShow.startTime}
                                        onChange={(e) => setNewShow({ ...newShow, startTime: e.target.value })}
                                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-primary"
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors mt-2"
                                >
                                    Schedule Show
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

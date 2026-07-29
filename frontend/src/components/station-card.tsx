'use client';

import { motion } from 'framer-motion';
import { Radio, Users, Play, Mic2 } from 'lucide-react';
import { useRadio } from '@/lib/radio-station';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type StationCardProps = {
    station: {
        station_id: string;
        station_name: string;
        broadcaster_id: string;
        listener_count: number;
        status: 'live' | 'offline';
    };
};

export function StationCard({ station }: StationCardProps) {
    const { joinStation } = useRadio();
    const [broadcasterName, setBroadcasterName] = useState('Loading...');

    useEffect(() => {
        const fetchBroadcaster = async () => {
            const { data } = await supabase
                .from('users')
                .select('display_name')
                .eq('user_id', station.broadcaster_id)
                .single();

            if (data) {
                setBroadcasterName(data.display_name);
            }
        };
        fetchBroadcaster();
    }, [station.broadcaster_id]);

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="glass-dark p-5 rounded-2xl border border-white/5 hover:border-primary/50 transition-colors group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/20 rounded-xl group-hover:bg-primary/30 transition-colors">
                    <Radio className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Live</span>
                </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-1 truncate">{station.station_name}</h3>

            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-6">
                <Mic2 className="w-3.5 h-3.5" />
                <span>{broadcasterName}</span>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <Users className="w-4 h-4" />
                    <span>{station.listener_count} listening</span>
                </div>

                <Link href={`/radio/${station.station_id}`}>
                    <button
                        onClick={() => joinStation(station.station_id)}
                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform"
                    >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                </Link>
            </div>
        </motion.div>
    );
}

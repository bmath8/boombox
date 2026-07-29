'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, MessageCircle, Play, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TrackReactions } from './track-reactions';
import { TrackComments } from './track-comments';
import { PlaylistTrack } from '@/lib/types';

interface PlaylistTrackCardProps {
    track: PlaylistTrack;
    currentUserId: string | null;
    onVote: () => void;
}

export function PlaylistTrackCard({
    track,
    currentUserId,
    onVote
}: PlaylistTrackCardProps) {
    const [isVoting, setIsVoting] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const handleVote = async (voteType: 'up' | 'down') => {
        if (!currentUserId || isVoting) return;

        setIsVoting(true);

        const { error } = await supabase.rpc('vote_on_playlist_track', {
            p_playlist_id: track.playlist_id,
            p_track_id: track.track_id,
            p_user_id: currentUserId,
            p_vote_type: voteType
        });

        if (!error) {
            onVote();
        }

        setIsVoting(false);
    };

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
        >
            <div className="flex items-center gap-4">
                {/* Position */}
                <div className="w-8 text-center text-muted-foreground font-medium">
                    {track.position + 1}
                </div>

                {/* Album Art */}
                {track.album_art_url && (
                    <img
                        src={track.album_art_url}
                        alt={track.album_name || track.track_name}
                        className="w-14 h-14 rounded object-cover"
                    />
                )}

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{track.track_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                    {track.added_by_user && (
                        <p className="text-xs text-white/40 mt-1">Added by {track.added_by_user.display_name}</p>
                    )}
                </div>

                {/* Voting */}
                {currentUserId && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleVote('up')}
                            disabled={isVoting}
                            className={`p-2 rounded-full transition-colors ${track.user_vote === 1
                                ? 'bg-green-500/20 text-green-400'
                                : 'hover:bg-white/10 text-white/60'
                                }`}
                        >
                            <ThumbsUp className="w-4 h-4" />
                        </button>
                        <span className={`min-w-[2rem] text-center font-semibold ${track.vote_count > 0 ? 'text-green-400' :
                            track.vote_count < 0 ? 'text-red-400' :
                                'text-white/60'
                            }`}>
                            {track.vote_count > 0 ? '+' : ''}{track.vote_count}
                        </span>
                        <button
                            onClick={() => handleVote('down')}
                            disabled={isVoting}
                            className={`p-2 rounded-full transition-colors ${track.user_vote === -1
                                ? 'bg-red-500/20 text-red-400'
                                : 'hover:bg-white/10 text-white/60'
                                }`}
                        >
                            <ThumbsDown className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Duration */}
                <span className="text-sm text-muted-foreground w-12 text-right">
                    {formatDuration(track.duration_ms)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <Play className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Comments & Reactions Section */}
            {showComments && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-white/10 space-y-4"
                >
                    {/* Reactions */}
                    <div>
                        <p className="text-xs font-medium text-white/60 mb-2">REACTIONS</p>
                        <TrackReactions
                            playlistId={track.playlist_id}
                            trackId={track.track_id}
                            currentUserId={currentUserId}
                        />
                    </div>

                    {/* Comments */}
                    <div>
                        <p className="text-xs font-medium text-white/60 mb-2">COMMENTS</p>
                        <TrackComments
                            playlistId={track.playlist_id}
                            trackId={track.track_id}
                            currentUserId={currentUserId}
                        />
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

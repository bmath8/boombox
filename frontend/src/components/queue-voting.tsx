'use client';

import { useState, useCallback } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QueueTrack {
    id: string;
    name: string;
    artist: string;
    addedBy: string;
    votes: number;
    userVote?: 'up' | 'down' | null;
}

interface QueueVotingProps {
    tracks: QueueTrack[];
    onVote: (trackId: string, vote: 'up' | 'down') => void;
    className?: string;
}

/**
 * Collaborative Queue Voting Component
 * 
 * Allows listeners to vote on queue tracks
 * Tracks with more upvotes move higher in queue
 * 
 * @example
 * ```tsx
 * <QueueVoting 
 *   tracks={queueTracks}
 *   onVote={(id, vote) => handleVote(id, vote)}
 * />
 * ```
 */
export function QueueVoting({ tracks, onVote, className }: QueueVotingProps) {
    const [votingTrack, setVotingTrack] = useState<string | null>(null);

    const handleVote = useCallback((trackId: string, vote: 'up' | 'down') => {
        setVotingTrack(trackId);
        onVote(trackId, vote);

        // Clear voting state after animation
        setTimeout(() => setVotingTrack(null), 300);
    }, [onVote]);

    const sortedTracks = [...tracks].sort((a, b) => b.votes - a.votes);

    return (
        <div className={cn('space-y-2', className)}>
            {sortedTracks.map((track, index) => (
                <motion.div
                    key={track.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        'flex items-center gap-3 p-3 rounded-lg',
                        'bg-white/5 hover:bg-white/10 transition-colors',
                        votingTrack === track.id && 'scale-[0.98]'
                    )}
                >
                    {/* Position */}
                    <div className="flex-shrink-0 w-8 text-center">
                        <span className="text-sm font-bold text-white/60">
                            #{index + 1}
                        </span>
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">
                            {track.name}
                        </h4>
                        <p className="text-xs text-white/60 truncate">
                            {track.artist} • Added by {track.addedBy}
                        </p>
                    </div>

                    {/* Voting Controls */}
                    <div className="flex items-center gap-2">
                        {/* Vote Count */}
                        <div className={cn(
                            'px-2 py-1 rounded-md text-xs font-bold min-w-[2.5rem] text-center',
                            track.votes > 0 && 'bg-green-500/20 text-green-400',
                            track.votes < 0 && 'bg-red-500/20 text-red-400',
                            track.votes === 0 && 'bg-white/10 text-white/60'
                        )}>
                            {track.votes > 0 && '+'}{track.votes}
                        </div>

                        {/* Upvote */}
                        <button
                            onClick={() => handleVote(track.id, 'up')}
                            className={cn(
                                'p-2 rounded-lg transition-all touch-target',
                                track.userVote === 'up'
                                    ? 'bg-green-500/30 text-green-400'
                                    : 'bg-white/10 text-white/60 hover:bg-green-500/20 hover:text-green-400'
                            )}
                            aria-label="Upvote"
                        >
                            <ThumbsUp className="w-4 h-4" />
                        </button>

                        {/* Downvote */}
                        <button
                            onClick={() => handleVote(track.id, 'down')}
                            className={cn(
                                'p-2 rounded-lg transition-all touch-target',
                                track.userVote === 'down'
                                    ? 'bg-red-500/30 text-red-400'
                                    : 'bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-400'
                            )}
                            aria-label="Downvote"
                        >
                            <ThumbsDown className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            ))}

            {tracks.length === 0 && (
                <div className="text-center py-12 text-white/40">
                    <p>No tracks in queue</p>
                    <p className="text-sm mt-1">Add songs to see voting</p>
                </div>
            )}
        </div>
    );
}

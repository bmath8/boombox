'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2 } from 'lucide-react';

type Comment = {
    comment_id: string;
    user_id: string;
    user_name: string;
    user_avatar?: string | undefined;
    comment_text: string;
    created_at: string;
};

type TrackCommentsProps = {
    playlistId: string;
    trackId: string;
    currentUserId: string | null;
};

export function TrackComments({ playlistId, trackId, currentUserId }: TrackCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('playlist_track_comments')
            .select(`
                comment_id,
                user_id,
                comment_text,
                created_at,
                users!playlist_track_comments_user_id_fkey(display_name, avatar_url)
            `)
            .eq('playlist_id', playlistId)
            .eq('track_id', trackId)
            .order('created_at', { ascending: true });

        if (data) {
            // Type for Supabase comment response
            interface CommentData {
                comment_id: string;
                user_id: string;
                comment_text: string;
                created_at: string;
                users?: {
                    display_name: string;
                    avatar_url?: string;
                };
            }

            const formattedComments: Comment[] = (data as unknown as CommentData[]).map((comment) => ({
                comment_id: comment.comment_id,
                user_id: comment.user_id,
                user_name: comment.users?.display_name || 'Unknown',
                user_avatar: comment.users?.avatar_url,
                comment_text: comment.comment_text,
                created_at: comment.created_at
            }));
            setComments(formattedComments);
        }
    };

    useEffect(() => {
        fetchComments();

        // Subscribe to comment changes
        const subscription = supabase
            .channel(`comments:${trackId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'playlist_track_comments',
                    filter: `track_id=eq.${trackId}`
                },
                () => {
                    fetchComments();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [playlistId, trackId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserId || isSubmitting) return;

        setIsSubmitting(true);

        const { error } = await supabase.rpc('add_track_comment', {
            p_playlist_id: playlistId,
            p_track_id: trackId,
            p_user_id: currentUserId,
            p_comment_text: newComment.trim()
        });

        if (!error) {
            setNewComment('');
            fetchComments();
        }

        setIsSubmitting(false);
    };

    const handleDelete = async (commentId: string) => {
        const { error } = await supabase
            .from('playlist_track_comments')
            .delete()
            .eq('comment_id', commentId);

        if (!error) {
            fetchComments();
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="space-y-4">
            {/* Comment List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                    {comments.map((comment) => (
                        <motion.div
                            key={comment.comment_id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex gap-3 p-3 bg-white/5 rounded-lg"
                        >
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                                {(comment.user_name?.[0] || '?').toUpperCase()}
                            </div>

                            {/* Comment Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-white">
                                        {comment.user_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTime(comment.created_at)}
                                    </span>
                                </div>
                                <p className="text-sm text-white/80">{comment.comment_text}</p>
                            </div>

                            {/* Delete Button (own comments only) */}
                            {currentUserId === comment.user_id && (
                                <button
                                    onClick={() => handleDelete(comment.comment_id)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {comments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No comments yet. Be the first to comment!
                    </div>
                )}
            </div>

            {/* Add Comment Form */}
            {currentUserId && (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmitting}
                        className="px-4 py-2 bg-primary hover:bg-primary/80 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Music2, Car, Dumbbell, PartyPopper, Coffee } from 'lucide-react';

type Theme = 'road_trip' | 'workout' | 'party' | 'chill' | 'custom';

type PlaylistCreatorProps = {
    isOpen: boolean;
    onClose: () => void;
    onPlaylistCreated: (playlistId: string) => void;
};

const THEMES = [
    { id: 'road_trip' as Theme, name: 'Road Trip', icon: Car, color: 'from-blue-500 to-cyan-500', emoji: '🚗' },
    { id: 'workout' as Theme, name: 'Workout', icon: Dumbbell, color: 'from-red-500 to-orange-500', emoji: '💪' },
    { id: 'party' as Theme, name: 'Party', icon: PartyPopper, color: 'from-pink-500 to-purple-500', emoji: '🎉' },
    { id: 'chill' as Theme, name: 'Chill', icon: Coffee, color: 'from-green-500 to-teal-500', emoji: '😴' },
    { id: 'custom' as Theme, name: 'Custom', icon: Music2, color: 'from-gray-500 to-gray-700', emoji: '🎵' },
];

export function CollaborativePlaylistCreator({ isOpen, onClose, onPlaylistCreated }: PlaylistCreatorProps) {
    const [playlistName, setPlaylistName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTheme, setSelectedTheme] = useState<Theme>('custom');
    const [votingEnabled, setVotingEnabled] = useState(true);
    const [autoSort, setAutoSort] = useState(false);
    const [maxTracks, setMaxTracks] = useState(10);
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!playlistName.trim()) return;

        setIsCreating(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsCreating(false);
            return;
        }

        const { data, error } = await supabase.rpc('create_collaborative_playlist', {
            p_creator_id: user.id,
            p_playlist_name: playlistName,
            p_description: description || null,
            p_theme: selectedTheme,
            p_voting_enabled: votingEnabled,
            p_auto_sort: autoSort,
            p_max_tracks: maxTracks
        });

        if (!error && data) {
            onPlaylistCreated(data);
            resetForm();
            onClose();
        }

        setIsCreating(false);
    };

    const resetForm = () => {
        setPlaylistName('');
        setDescription('');
        setSelectedTheme('custom');
        setVotingEnabled(true);
        setAutoSort(false);
        setMaxTracks(10);
        setCoverImage(null);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Create Collaborative Playlist</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Playlist Name */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Playlist Name *
                            </label>
                            <input
                                type="text"
                                value={playlistName}
                                onChange={(e) => setPlaylistName(e.target.value)}
                                placeholder="My Awesome Playlist"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                maxLength={200}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe your playlist..."
                                rows={3}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                            />
                        </div>

                        {/* Theme Selection */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-3">
                                Theme
                            </label>
                            <div className="grid grid-cols-5 gap-3">
                                {THEMES.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setSelectedTheme(theme.id)}
                                        className={`relative p-4 rounded-xl border-2 transition-all ${selectedTheme === theme.id
                                                ? 'border-primary bg-primary/10'
                                                : 'border-white/10 hover:border-white/20 bg-white/5'
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">{theme.emoji}</div>
                                        <p className="text-xs font-medium text-white">{theme.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Settings */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-white mb-3">
                                Settings
                            </label>

                            {/* Voting Enabled */}
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <div>
                                    <p className="font-medium text-white">Enable Voting</p>
                                    <p className="text-xs text-muted-foreground">Allow collaborators to upvote/downvote tracks</p>
                                </div>
                                <button
                                    onClick={() => setVotingEnabled(!votingEnabled)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${votingEnabled ? 'bg-primary' : 'bg-white/20'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${votingEnabled ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Auto-sort */}
                            {votingEnabled && (
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                    <div>
                                        <p className="font-medium text-white">Auto-sort by Votes</p>
                                        <p className="text-xs text-muted-foreground">Automatically reorder tracks by vote count</p>
                                    </div>
                                    <button
                                        onClick={() => setAutoSort(!autoSort)}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${autoSort ? 'bg-primary' : 'bg-white/20'
                                            }`}
                                    >
                                        <div
                                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${autoSort ? 'translate-x-7' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            )}

                            {/* Max Tracks per User */}
                            <div className="p-4 bg-white/5 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-medium text-white">Max Tracks per User</p>
                                    <span className="text-primary font-semibold">{maxTracks}</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    step="5"
                                    value={maxTracks}
                                    onChange={(e) => setMaxTracks(parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>5</span>
                                    <span>50</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-gray-900/95 backdrop-blur-sm">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!playlistName.trim() || isCreating}
                            className="px-6 py-2 bg-primary hover:bg-primary/80 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Playlist'
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

import React, { useState, useEffect } from 'react';
import { Music, UserPlus, Crown, Clock, GripVertical, Trash2, Wand2, Settings2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { TrackSelectionModal } from './track-selection-modal';
import { QueueItem } from '@/lib/types';
import { handleError } from '@/lib/error-handler';
import { LoadingState } from '@/components/ui/loading-state';
import { useFetch } from '@/hooks/use-fetch';
import { QueueSettings } from './queue-settings';
import { AIDJAssistant } from './ai-dj-assistant';
import { AdvancedDJControls } from './advanced-dj-controls';
import { isMockStation } from '@/lib/constants';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DJQueuePanelProps {
    stationId: string;
    currentUserId: string | null;
    isBroadcaster: boolean;
}

// Sortable Item Component
function SortableQueueItem({ item, index, isBroadcaster, onRemove }: {
    item: QueueItem;
    index: number;
    isBroadcaster: boolean;
    onRemove: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.queue_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
        >
            {isBroadcaster && (
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-white/30 hover:text-white/70"
                >
                    <GripVertical className="w-4 h-4" />
                </div>
            )}

            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-medium text-white">
                {index + 2}
            </div>

            {item.album_art_url ? (
                <img
                    src={item.album_art_url}
                    alt={`Album art for ${item.track_name}`}
                    className="w-10 h-10 rounded object-cover"
                />
            ) : (
                <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                    <Music className="w-5 h-5 text-white/50" />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                    {item.user?.display_name || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {item.track_name}
                </p>
            </div>

            {isBroadcaster && (
                <button
                    onClick={() => onRemove(item.queue_id)}
                    className="p-2 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove from queue"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}

            {!isBroadcaster && <Clock className="w-4 h-4 text-white/40" />}
        </div>
    );
}

export function DJQueuePanel({ stationId, currentUserId, isBroadcaster }: DJQueuePanelProps) {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [currentDJ, setCurrentDJ] = useState<QueueItem | null>(null);
    const [userInQueue, setUserInQueue] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Settings State
    const [crossfade, setCrossfade] = useState(3);
    const [autoQueue, setAutoQueue] = useState(true);
    const [autoQueueSource, setAutoQueueSource] = useState<'playlist' | 'recommendations'>('playlist');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setQueue((items) => {
                const oldIndex = items.findIndex((i) => i.queue_id === active.id);
                const newIndex = items.findIndex((i) => i.queue_id === over.id);

                const newQueue = arrayMove(items, oldIndex, newIndex);

                // Update positions in DB
                updateQueuePositions(newQueue);

                return newQueue;
            });
        }
    };

    const updateQueuePositions = async (newQueue: QueueItem[]) => {
        try {
            const updates = newQueue.map((item, index) => ({
                queue_id: item.queue_id,
                position: index,
            }));

            const { error } = await supabase
                .from('dj_queue')
                .upsert(updates);

            if (error) throw error;
        } catch (error) {
            handleError(error, 'Update Queue Positions');
            refreshQueue(); // Revert on error
        }
    };

    const handleRemoveItem = async (queueId: string) => {
        try {
            const { error } = await supabase
                .from('dj_queue')
                .delete()
                .eq('queue_id', queueId);

            if (error) throw error;

            // Optimistic update
            setQueue(prev => prev.filter(item => item.queue_id !== queueId));
        } catch (error) {
            handleError(error, 'Remove Queue Item');
        }
    };

    const handleJoinQueue = async () => {
        if (!currentUserId) return;
        try {
            setShowModal(true);
        } catch (error) {
            handleError(error, 'JoinQueue');
        }
    };

    const fetchQueueData = async () => {
        const { data, error } = await supabase
            .from('dj_queue')
            .select(`
                queue_id,
                station_id,
                user_id,
                track_uri,
                track_name,
                artist_name,
                album_art_url,
                duration_ms,
                position,
                status,
                users!dj_queue_user_id_fkey(display_name)
            `)
            .eq('station_id', stationId)
            .eq('status', 'pending')
            .order('position', { ascending: true });

        if (error) throw error;

        // Type for Supabase queue response
        interface QueueData {
            queue_id: string;
            station_id: string;
            user_id: string;
            track_uri: string;
            track_name: string;
            artist_name: string;
            album_art_url?: string;
            duration_ms: number;
            position: number;
            status: string;
            users?: {
                display_name: string;
            };
        }

        return (data as unknown as QueueData[]).map((item) => ({
            queue_id: item.queue_id,
            station_id: item.station_id,
            user_id: item.user_id,
            track_uri: item.track_uri,
            track_name: item.track_name,
            artist_name: item.artist_name,
            album_art_url: item.album_art_url || '', // Provide default empty string
            duration_ms: item.duration_ms,
            position: item.position,
            status: item.status as QueueItem['status'],
            user: {
                display_name: item.users?.display_name || 'Unknown'
            }
        }));
    };

    const { data: queueData, loading, mutate: refreshQueue } = useFetch<QueueItem[]>(
        stationId && !isMockStation(stationId) ? `queue:${stationId}` : null,
        fetchQueueData,
        { dedupingInterval: 5000 }
    );

    useEffect(() => {
        if (queueData) {
            setQueue(queueData);
            setCurrentDJ(queueData[0] || null);
            setUserInQueue(queueData.some(dj => dj.user_id === currentUserId));
        }
    }, [queueData, currentUserId]);

    useEffect(() => {
        // Subscribe to queue changes
        const subscription = supabase
            .channel(`dj_queue:${stationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'dj_queue',
                    filter: `station_id=eq.${stationId}`
                },
                () => {
                    refreshQueue();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [stationId, refreshQueue]);

    if (loading) {
        return <LoadingState />;
    }

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary" />
                    DJ Queue ({queue.length})
                </h3>
                <div className="flex items-center gap-2">
                    {isBroadcaster && (
                        <QueueSettings
                            crossfadeDuration={crossfade}
                            onCrossfadeChange={setCrossfade}
                            autoQueueEnabled={autoQueue}
                            onAutoQueueChange={setAutoQueue}
                            autoQueueSource={autoQueueSource}
                            onAutoQueueSourceChange={setAutoQueueSource}
                        />
                    )}
                    {
                        !userInQueue && !isBroadcaster && currentUserId && (
                            <button
                                onClick={handleJoinQueue}
                                aria-label="Join DJ Queue"
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium rounded-full transition-colors"
                            >
                                <UserPlus className="w-3 h-3" />
                                Join Queue
                            </button>
                        )
                    }
                </div>
            </div>

            {/* Current DJ */}
            {
                currentDJ && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-lg border-2 border-primary/50 bg-gradient-to-br from-primary/20 to-primary/5 p-3 mb-4"
                    >
                        <div className="absolute top-2 right-2">
                            <Crown className="w-5 h-5 text-yellow-400" />
                        </div>

                        <div className="flex items-center gap-3">
                            {currentDJ.album_art_url ? (
                                <img
                                    src={currentDJ.album_art_url}
                                    alt={`Album art for ${currentDJ.track_name}`}
                                    className="w-12 h-12 rounded-md object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center">
                                    <Music className="w-6 h-6 text-white/50" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-primary font-medium mb-0.5">NOW PLAYING</p>
                                <p className="text-sm font-semibold text-white truncate">
                                    {currentDJ.track_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    by {currentDJ.artist_name}
                                </p>
                                <p className="text-xs text-white/40 mt-1">
                                    DJ: {currentDJ.user?.display_name || 'Unknown'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )
            }

            {/* Queue List */}
            <div className="space-y-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={queue.slice(1).map(i => i.queue_id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <AnimatePresence>
                            {queue.slice(1).map((dj, index) => (
                                <SortableQueueItem
                                    key={dj.queue_id}
                                    item={dj}
                                    index={index}
                                    isBroadcaster={isBroadcaster}
                                    onRemove={handleRemoveItem}
                                />
                            ))}
                        </AnimatePresence>
                    </SortableContext>
                </DndContext>

                {queue.length <= 1 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No DJs in queue</p>
                        <p className="text-xs mt-1">Be the first to join!</p>
                    </div>
                )}
            </div>

            {/* Broadcaster Tools */}
            {isBroadcaster && (
                <div className="mt-6 space-y-4">
                    {/* Advanced DJ Controls */}
                    <AdvancedDJControls
                        queue={queue}
                        onSkip={() => queue[0] && handleRemoveItem(queue[0].queue_id)}
                        onUpdateQueue={setQueue}
                    />

                    {/* AI DJ Assistant */}
                    <AIDJAssistant />
                </div>
            )}

            {/* Track Selection Modal */}
            <TrackSelectionModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                stationId={stationId}
                onTrackSelected={() => {
                    setShowModal(false);
                    refreshQueue();
                }}
            />
        </>
    );
}

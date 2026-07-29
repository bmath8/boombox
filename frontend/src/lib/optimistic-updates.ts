/**
 * Optimistic Update Utilities
 * Provides helpers for implementing optimistic UI updates with automatic rollback on error
 */

import { logger } from './logger';
import { handleError } from './error-handler';

/**
 * Optimistic update wrapper
 * Updates UI immediately, then performs async operation
 * Rolls back on error
 * 
 * @param optimisticUpdate - Function to update UI optimistically
 * @param asyncOperation - Async operation to perform
 * @param rollback - Function to rollback UI on error
 * @param errorContext - Context for error logging
 */
export async function withOptimisticUpdate<T>(
    optimisticUpdate: () => void,
    asyncOperation: () => Promise<T>,
    rollback: () => void,
    errorContext: string
): Promise<T | null> {
    // Apply optimistic update immediately
    optimisticUpdate();

    try {
        // Perform async operation
        const result = await asyncOperation();
        logger.debug('Optimistic update succeeded', { context: errorContext });
        return result;
    } catch (error) {
        // Rollback on error
        logger.warn('Optimistic update failed, rolling back', { context: errorContext });
        rollback();
        handleError(error, errorContext);
        return null;
    }
}

/**
 * Optimistic vote update
 * For upvote/downvote functionality
 */
export function useOptimisticVote() {
    return async function optimisticVote(
        currentVote: number | null,
        currentCount: number,
        newVote: 1 | -1,
        setVote: (vote: number | null) => void,
        setCount: (count: number) => void,
        apiCall: () => Promise<void>
    ) {
        // Calculate optimistic values
        let countDelta = 0;

        if (currentVote === newVote) {
            // Removing vote
            countDelta = -newVote;
        } else if (currentVote === null) {
            // Adding new vote
            countDelta = newVote;
        } else {
            // Changing vote (e.g., upvote to downvote)
            countDelta = newVote - currentVote;
        }

        const optimisticVote = currentVote === newVote ? null : newVote;
        const optimisticCount = currentCount + countDelta;

        // Store original values for rollback
        const originalVote = currentVote;
        const originalCount = currentCount;

        await withOptimisticUpdate(
            () => {
                setVote(optimisticVote);
                setCount(optimisticCount);
            },
            apiCall,
            () => {
                setVote(originalVote);
                setCount(originalCount);
            },
            'Vote'
        );
    };
}

/**
 * Optimistic list update
 * For adding/removing items from lists (comments, reactions, etc.)
 */
export function useOptimisticList<T>() {
    return {
        /**
         * Add item optimistically
         */
        async add(
            items: T[],
            newItem: T,
            setItems: (items: T[]) => void,
            apiCall: () => Promise<void>
        ) {
            const originalItems = items;

            await withOptimisticUpdate(
                () => setItems([...items, newItem]),
                apiCall,
                () => setItems(originalItems),
                'Add Item'
            );
        },

        /**
         * Remove item optimistically
         */
        async remove(
            items: T[],
            predicate: (item: T) => boolean,
            setItems: (items: T[]) => void,
            apiCall: () => Promise<void>
        ) {
            const originalItems = items;

            await withOptimisticUpdate(
                () => setItems(items.filter(item => !predicate(item))),
                apiCall,
                () => setItems(originalItems),
                'Remove Item'
            );
        },

        /**
         * Update item optimistically
         */
        async update(
            items: T[],
            predicate: (item: T) => boolean,
            updater: (item: T) => T,
            setItems: (items: T[]) => void,
            apiCall: () => Promise<void>
        ) {
            const originalItems = items;

            await withOptimisticUpdate(
                () => setItems(items.map(item => predicate(item) ? updater(item) : item)),
                apiCall,
                () => setItems(originalItems),
                'Update Item'
            );
        },
    };
}

/**
 * Optimistic counter update
 * For incrementing/decrementing counters (likes, plays, etc.)
 */
export async function optimisticCounter(
    currentValue: number,
    delta: number,
    setValue: (value: number) => void,
    apiCall: () => Promise<void>
) {
    const originalValue = currentValue;

    await withOptimisticUpdate(
        () => setValue(currentValue + delta),
        apiCall,
        () => setValue(originalValue),
        'Counter Update'
    );
}

/**
 * Optimistic toggle update
 * For boolean toggles (follow/unfollow, like/unlike, etc.)
 */
export async function optimisticToggle(
    currentValue: boolean,
    setValue: (value: boolean) => void,
    apiCall: () => Promise<void>
) {
    const originalValue = currentValue;

    await withOptimisticUpdate(
        () => setValue(!currentValue),
        apiCall,
        () => setValue(originalValue),
        'Toggle'
    );
}

/**
 * Example Usage:
 * 
 * // Voting
 * const optimisticVote = useOptimisticVote();
 * 
 * const handleVote = (voteType: 1 | -1) => {
 *     optimisticVote(
 *         userVote,
 *         voteCount,
 *         voteType,
 *         setUserVote,
 *         setVoteCount,
 *         () => supabase.rpc('vote_on_track', { track_id, vote: voteType })
 *     );
 * };
 * 
 * // Adding comment
 * const { add } = useOptimisticList<Comment>();
 * 
 * const handleAddComment = (text: string) => {
 *     const newComment = {
 *         id: 'temp-' + Date.now(),
 *         text,
 *         user: currentUser,
 *         created_at: new Date().toISOString()
 *     };
 *     
 *     add(
 *         comments,
 *         newComment,
 *         setComments,
 *         () => supabase.from('comments').insert({ text })
 *     );
 * };
 * 
 * // Like button
 * const handleLike = () => {
 *     optimisticToggle(
 *         isLiked,
 *         setIsLiked,
 *         () => supabase.from('likes').insert({ track_id })
 *     );
 * };
 */

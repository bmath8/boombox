import { toast } from 'sonner';

/**
 * Enhanced Toast Utilities
 *
 * Provides toast notifications with action buttons and undo functionality.
 * Built on top of Sonner for consistent notifications across the app.
 */

/**
 * Show a success toast with optional undo action
 */
export function showSuccessToast(
    message: string,
    options?: {
        description?: string;
        action?: {
            label: string;
            onClick: () => void | Promise<void>;
        };
        duration?: number;
    }
) {
    return toast.success(message, {
        description: options?.description,
        action: options?.action,
        duration: options?.duration || 4000,
    });
}

/**
 * Show an error toast with optional retry action
 */
export function showErrorToast(
    message: string,
    options?: {
        description?: string;
        action?: {
            label: string;
            onClick: () => void | Promise<void>;
        };
        duration?: number;
    }
) {
    return toast.error(message, {
        description: options?.description,
        action: options?.action,
        duration: options?.duration || 5000,
    });
}

/**
 * Show a toast with undo functionality
 *
 * Usage:
 * ```ts
 * showUndoToast(
 *   'Station deleted',
 *   async () => {
 *     await restoreStation(id);
 *     toast.success('Station restored');
 *   }
 * );
 * ```
 */
export function showUndoToast(
    message: string,
    onUndo: () => void | Promise<void>,
    options?: {
        description?: string;
        duration?: number;
    }
) {
    return toast.success(message, {
        description: options?.description,
        action: {
            label: 'Undo',
            onClick: onUndo,
        },
        duration: options?.duration || 5000,
    });
}

/**
 * Show a loading toast that can be updated
 *
 * Usage:
 * ```ts
 * const toastId = showLoadingToast('Uploading...');
 * // ... do async work
 * updateLoadingToast(toastId, 'Upload complete!', 'success');
 * ```
 */
export function showLoadingToast(
    message: string,
    options?: {
        description?: string;
    }
) {
    return toast.loading(message, {
        description: options?.description,
    });
}

/**
 * Update a loading toast with progress
 */
export function updateLoadingToast(
    toastId: string | number,
    message: string,
    type: 'loading' | 'success' | 'error',
    options?: {
        description?: string;
    }
) {
    if (type === 'success') {
        toast.success(message, {
            id: toastId,
            description: options?.description,
        });
    } else if (type === 'error') {
        toast.error(message, {
            id: toastId,
            description: options?.description,
        });
    } else {
        toast.loading(message, {
            id: toastId,
            description: options?.description,
        });
    }
}

/**
 * Show a promise toast (automatically handles loading/success/error states)
 *
 * Usage:
 * ```ts
 * showPromiseToast(
 *   uploadFile(),
 *   {
 *     loading: 'Uploading...',
 *     success: 'Upload complete!',
 *     error: 'Upload failed'
 *   }
 * );
 * ```
 */
export function showPromiseToast<T>(
    promise: Promise<T>,
    messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
    }
) {
    return toast.promise(promise, messages);
}

/**
 * Optimistic update pattern with undo
 *
 * Performs an optimistic UI update, shows undo toast, and reverts on undo.
 *
 * Usage:
 * ```ts
 * optimisticUpdate(
 *   () => setItems(prev => prev.filter(i => i.id !== itemId)),
 *   () => setItems(prev => [...prev, originalItem]),
 *   () => api.deleteItem(itemId),
 *   'Item deleted'
 * );
 * ```
 */
export async function optimisticUpdate<T>(
    optimisticFn: () => void,
    revertFn: () => void,
    actualFn: () => Promise<T>,
    message: string,
    options?: {
        undoDuration?: number;
        onSuccess?: (result: T) => void;
        onError?: (error: any) => void;
    }
) {
    // Apply optimistic update
    optimisticFn();

    let undone = false;

    // Show undo toast
    showUndoToast(
        message,
        () => {
            undone = true;
            revertFn();
        },
        { duration: options?.undoDuration || 5000 }
    );

    // Wait for undo duration
    await new Promise((resolve) =>
        setTimeout(resolve, options?.undoDuration || 5000)
    );

    // If not undone, perform actual operation
    if (!undone) {
        try {
            const result = await actualFn();
            options?.onSuccess?.(result);
        } catch (error) {
            // Revert on error
            revertFn();
            showErrorToast('Operation failed', {
                description: 'Changes have been reverted',
            });
            options?.onError?.(error);
        }
    }
}

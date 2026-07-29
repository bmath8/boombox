'use client';

import { useState } from 'react';
import {
    showSuccessToast,
    showErrorToast,
    showUndoToast,
    showLoadingToast,
    updateLoadingToast,
    showPromiseToast,
    optimisticUpdate,
} from '@/lib/toast-utils';

/**
 * Toast Examples Component
 *
 * Demonstrates how to use the enhanced toast utilities.
 * This file serves as documentation and can be removed in production.
 */
export function ToastExamples() {
    const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3']);

    // Example 1: Success toast with action
    const handleSuccessWithAction = () => {
        showSuccessToast('Settings saved', {
            description: 'Your preferences have been updated',
            action: {
                label: 'View',
                onClick: () => console.log('Navigating to settings...'),
            },
        });
    };

    // Example 2: Error toast with retry
    const handleErrorWithRetry = () => {
        showErrorToast('Connection failed', {
            description: 'Unable to reach the server',
            action: {
                label: 'Retry',
                onClick: () => console.log('Retrying connection...'),
            },
        });
    };

    // Example 3: Undo delete
    const handleDelete = (item: string) => {
        const originalItems = [...items];

        // Optimistic update
        setItems((prev) => prev.filter((i) => i !== item));

        // Show undo toast
        showUndoToast(`Deleted "${item}"`, () => {
            // Undo action
            setItems(originalItems);
        });

        // Actual delete after 5 seconds
        setTimeout(async () => {
            // await api.deleteItem(item);
            console.log(`Actually deleted ${item}`);
        }, 5000);
    };

    // Example 4: Loading with progress
    const handleUpload = async () => {
        const toastId = showLoadingToast('Uploading file...', {
            description: '0% complete',
        });

        // Simulate upload progress
        for (let i = 0; i <= 100; i += 20) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            updateLoadingToast(toastId, 'Uploading file...', 'loading', {
                description: `${i}% complete`,
            });
        }

        updateLoadingToast(toastId, 'Upload complete!', 'success');
    };

    // Example 5: Promise toast
    const handleAsyncOperation = () => {
        const fakePromise = new Promise((resolve, reject) => {
            setTimeout(() => {
                Math.random() > 0.5 ? resolve('Success!') : reject('Failed!');
            }, 2000);
        });

        showPromiseToast(fakePromise, {
            loading: 'Processing...',
            success: 'Operation completed!',
            error: 'Operation failed!',
        });
    };

    // Example 6: Optimistic update
    const handleOptimisticDelete = (item: string) => {
        optimisticUpdate(
            // Optimistic update
            () => setItems((prev) => prev.filter((i) => i !== item)),
            // Revert function
            () => setItems((prev) => [...prev, item]),
            // Actual API call
            async () => {
                await new Promise((resolve) => setTimeout(resolve, 5000));
                // await api.deleteItem(item);
                return { success: true };
            },
            `"${item}" deleted`,
            {
                onSuccess: () => console.log('Delete successful'),
                onError: () => console.log('Delete failed'),
            }
        );
    };

    return (
        <div className="p-8 space-y-4 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Toast Examples</h2>

            <button
                onClick={handleSuccessWithAction}
                className="px-4 py-2 bg-green-500 rounded mr-2"
            >
                Success with Action
            </button>

            <button
                onClick={handleErrorWithRetry}
                className="px-4 py-2 bg-red-500 rounded mr-2"
            >
                Error with Retry
            </button>

            <button
                onClick={handleUpload}
                className="px-4 py-2 bg-blue-500 rounded mr-2"
            >
                Upload with Progress
            </button>

            <button
                onClick={handleAsyncOperation}
                className="px-4 py-2 bg-purple-500 rounded mr-2"
            >
                Promise Toast
            </button>

            <div className="mt-8">
                <h3 className="text-xl font-semibold mb-2">Items (with undo delete):</h3>
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li key={item} className="flex items-center justify-between p-2 bg-white/5 rounded">
                            <span>{item}</span>
                            <div>
                                <button
                                    onClick={() => handleDelete(item)}
                                    className="px-3 py-1 bg-yellow-500 rounded text-sm mr-2"
                                >
                                    Delete (Simple)
                                </button>
                                <button
                                    onClick={() => handleOptimisticDelete(item)}
                                    className="px-3 py-1 bg-red-500 rounded text-sm"
                                >
                                    Delete (Optimistic)
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

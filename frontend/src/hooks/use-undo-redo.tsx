'use client';

import { useEffect, useCallback } from 'react';
import { undoRedoManager } from '@/lib/undo-redo/manager';
import type { Command } from '@/lib/undo-redo/command';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Undo2 } from 'lucide-react';

/**
 * Hook for using undo/redo functionality
 */

export function useUndoRedo() {
    const executeCommand = useCallback(async (command: Command) => {
        await undoRedoManager.executeCommand(command);

        // Show toast with undo button
        toast.success(command.description, {
            action: {
                label: 'Undo',
                onClick: async () => {
                    await undo();
                },
            },
            duration: 5000,
        });
    }, []);

    const undo = useCallback(async () => {
        const command = await undoRedoManager.undo();
        if (command) {
            toast.success(`Undid: ${command.description}`, {
                action: {
                    label: 'Redo',
                    onClick: async () => {
                        await redo();
                    },
                },
            });
        }
    }, []);

    const redo = useCallback(async () => {
        const command = await undoRedoManager.redo();
        if (command) {
            toast.success(`Redid: ${command.description}`);
        }
    }, []);

    const canUndo = undoRedoManager.canUndo();
    const canRedo = undoRedoManager.canRedo();

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo) {
                    undo();
                }
            }

            // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                if (canRedo) {
                    redo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, undo, redo]);

    return {
        executeCommand,
        undo,
        redo,
        canUndo,
        canRedo,
        getHistory: () => undoRedoManager.getUndoHistory(),
        clear: () => undoRedoManager.clear(),
    };
}

/**
 * Undo Button Component
 */
export function UndoButton() {
    const { undo, canUndo } = useUndoRedo();

    if (!canUndo) return null;

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            className="gap-2"
        >
            <Undo2 className="h-4 w-4" />
            Undo
        </Button>
    );
}

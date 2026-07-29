import type { Command } from './command';

/**
 * Undo/Redo Manager
 *
 * Manages the history of commands for undo/redo functionality
 */

export class UndoRedoManager {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];
    private maxHistorySize: number;

    constructor(maxHistorySize: number = 50) {
        this.maxHistorySize = maxHistorySize;
    }

    /**
     * Execute a new command and add it to the undo stack
     */
    async executeCommand(command: Command): Promise<void> {
        await command.execute();

        this.undoStack.push(command);
        this.redoStack = []; // Clear redo stack when new command is executed

        // Limit stack size
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
    }

    /**
     * Undo the last command
     */
    async undo(): Promise<Command | null> {
        const command = this.undoStack.pop();
        if (!command) return null;

        await command.undo();
        this.redoStack.push(command);

        return command;
    }

    /**
     * Redo the last undone command
     */
    async redo(): Promise<Command | null> {
        const command = this.redoStack.pop();
        if (!command) return null;

        if (command.redo) {
            await command.redo();
        } else {
            await command.execute();
        }

        this.undoStack.push(command);

        return command;
    }

    /**
     * Check if undo is available
     */
    canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    /**
     * Check if redo is available
     */
    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /**
     * Get the last command that can be undone
     */
    peekUndo(): Command | null {
        return this.undoStack[this.undoStack.length - 1] || null;
    }

    /**
     * Get the last command that can be redone
     */
    peekRedo(): Command | null {
        return this.redoStack[this.redoStack.length - 1] || null;
    }

    /**
     * Get the undo history
     */
    getUndoHistory(): Command[] {
        return [...this.undoStack];
    }

    /**
     * Get the redo history
     */
    getRedoHistory(): Command[] {
        return [...this.redoStack];
    }

    /**
     * Clear all history
     */
    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Get history size
     */
    getHistorySize(): { undo: number; redo: number } {
        return {
            undo: this.undoStack.length,
            redo: this.redoStack.length,
        };
    }
}

// Singleton instance
export const undoRedoManager = new UndoRedoManager();

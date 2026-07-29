'use client';

import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsModal } from '@/components/keyboard-shortcuts-modal';

/**
 * Keyboard Shortcuts Provider
 *
 * Wraps the app to provide global keyboard shortcuts functionality.
 * Must be used in a client component context.
 */
export function KeyboardShortcutsProvider() {
    useKeyboardShortcuts();

    return <KeyboardShortcutsModal />;
}

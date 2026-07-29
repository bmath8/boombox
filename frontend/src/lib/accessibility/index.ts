/**
 * Accessibility Library Index
 *
 * Central export for all accessibility utilities and components
 */

// Components
export { FocusTrap } from './focus-trap';
export { LiveRegion, useLiveAnnouncer } from './live-region';
export { SkipLinks } from './skip-links';

// Hooks and utilities
export {
    useKeyboardShortcuts,
    showKeyboardShortcutsHelp,
    formatShortcut,
    DEFAULT_PLAYER_SHORTCUTS,
    type KeyboardShortcut,
} from './keyboard-shortcuts';

// ARIA helpers
export {
    generateId,
    getAriaLabel,
    announceToScreenReader,
    isFocusable,
    getNextFocusable,
    buildAriaProps,
    RovingTabindex,
    type AriaDescription,
} from './aria-helpers';

// Color contrast
export {
    getContrastRatio,
    meetsWCAG_AA,
    meetsWCAG_AAA,
    getAccessibleTextColor,
    validateColorContrast,
    auditColorPairs,
    type ColorPair,
    type ContrastValidationResult,
} from './color-contrast';

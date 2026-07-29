import React, { ReactNode } from 'react';

/**
 * Visually Hidden Component
 *
 * Hides content visually but keeps it accessible to screen readers
 * Implements the sr-only pattern
 */

interface VisuallyHiddenProps {
    children: ReactNode;
    as?: keyof React.JSX.IntrinsicElements;
}

export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
    return <Component className="sr-only">{children}</Component>;
}

// Also export as ScreenReaderOnly for clarity
export const ScreenReaderOnly = VisuallyHidden;

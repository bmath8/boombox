'use client';

import { LucideIcon } from 'lucide-react';

/**
 * Accessible Icon Component
 *
 * Wraps Lucide icons with proper ARIA attributes
 */

interface AccessibleIconProps {
    icon: LucideIcon;
    label: string;
    decorative?: boolean;
    className?: string;
    size?: number;
}

export function AccessibleIcon({
    icon: Icon,
    label,
    decorative = false,
    className,
    size = 24,
}: AccessibleIconProps) {
    if (decorative) {
        return (
            <Icon
                className={className}
                size={size}
                aria-hidden="true"
                focusable="false"
            />
        );
    }

    return (
        <Icon
            className={className}
            size={size}
            role="img"
            aria-label={label}
            focusable="false"
        />
    );
}

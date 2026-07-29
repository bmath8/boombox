'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    /**
     * Icon to display (pass a Lucide icon component)
     */
    icon: ReactNode;

    /**
     * Title of the empty state
     */
    title: string;

    /**
     * Description text
     */
    description: string;

    /**
     * Optional action button or element
     */
    action?: ReactNode;

    /**
     * Additional CSS classes
     */
    className?: string;
}

/**
 * EmptyState Component
 *
 * Display a helpful empty state when there's no data to show.
 * Guides users on what to do next.
 *
 * Usage:
 * <EmptyState
 *   icon={<Radio className="w-16 h-16" />}
 *   title="No Live Stations"
 *   description="Be the first to start broadcasting!"
 *   action={<Button>Start Broadcasting</Button>}
 * />
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
    className
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-12 text-center',
                className
            )}
        >
            {/* Icon */}
            <div className="mb-4 text-muted-foreground opacity-50">
                {icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-heading font-bold text-white mb-2">
                {title}
            </h3>

            {/* Description */}
            <p className="text-muted-foreground mb-6 max-w-md">
                {description}
            </p>

            {/* Action */}
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
}

/**
 * Compact Empty State (for smaller sections)
 */
export function CompactEmptyState({
    icon,
    message,
    className
}: {
    icon: ReactNode;
    message: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-8 text-center',
                className
            )}
        >
            <div className="mb-2 text-muted-foreground opacity-40">
                {icon}
            </div>
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

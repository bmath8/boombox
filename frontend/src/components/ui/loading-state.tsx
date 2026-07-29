'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
    /**
     * Variant of the loading state
     * - spinner: Animated spinner icon
     * - skeleton: Skeleton placeholder
     * - pulse: Pulsing animation
     */
    variant?: 'spinner' | 'skeleton' | 'pulse';

    /**
     * Size of the loading indicator
     */
    size?: 'sm' | 'md' | 'lg' | 'xl';

    /**
     * Optional message to display
     */
    message?: string;

    /**
     * Additional CSS classes
     */
    className?: string;

    /**
     * Full screen loading overlay
     */
    fullScreen?: boolean;
}

/**
 * Standardized Loading State Component
 * 
 * Usage:
 * <LoadingState /> // Default spinner
 * <LoadingState variant="skeleton" /> // Skeleton loader
 * <LoadingState variant="spinner" size="lg" message="Loading..." /> // Large spinner with message
 * <LoadingState fullScreen /> // Full screen overlay
 */
export function LoadingState({
    variant = 'spinner',
    size = 'md',
    message,
    className,
    fullScreen = false,
}: LoadingStateProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    const content = (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'flex flex-col items-center justify-center gap-3',
                fullScreen && 'min-h-screen',
                className
            )}
        >
            {variant === 'spinner' && (
                <Loader2
                    data-testid="spinner-loader"
                    className={cn(
                        'animate-spin text-primary',
                        sizeClasses[size]
                    )}
                />
            )}

            {variant === 'skeleton' && (
                <div className="space-y-3 w-full max-w-md">
                    <div data-testid="skeleton-1" className="h-4 bg-white/10 rounded animate-pulse" />
                    <div data-testid="skeleton-2" className="h-4 bg-white/10 rounded animate-pulse w-5/6" />
                    <div data-testid="skeleton-3" className="h-4 bg-white/10 rounded animate-pulse w-4/6" />
                </div>
            )}

            {variant === 'pulse' && (
                <div
                    data-testid="pulse-loader"
                    className={cn(
                        'bg-primary/20 rounded-full animate-pulse',
                        sizeClasses[size]
                    )}
                />
            )}

            {message && (
                <p className="text-sm text-muted-foreground animate-pulse">
                    {message}
                </p>
            )}
            {!message && <span className="sr-only">Loading...</span>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                {content}
            </div>
        );
    }

    return content;
}

/**
 * Skeleton Loader for specific content types
 */
export function SkeletonCard() {
    return (
        <div className="glass-dark rounded-xl p-4 space-y-3 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-4 bg-white/10 rounded w-1/2" />
            <div className="h-20 bg-white/10 rounded" />
        </div>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-white/10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonTrack() {
    return (
        <div className="flex items-center gap-4 p-3 rounded-lg animate-pulse">
            <div className="w-16 h-16 bg-white/10 rounded" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-2/3" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
            <div className="w-20 h-8 bg-white/10 rounded" />
        </div>
    );
}

/**
 * Loading wrapper for async components
 */
export function LoadingWrapper({
    loading,
    children,
    fallback,
}: {
    loading: boolean;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    if (loading) {
        return fallback || <LoadingState />;
    }

    return <>{children}</>;
}

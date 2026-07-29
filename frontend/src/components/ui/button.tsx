'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'link';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    loading?: boolean;
    loadingText?: string;
}

/**
 * Button Component with Loading State
 *
 * Features:
 * - Multiple variants and sizes
 * - Built-in loading state
 * - Disabled state handling
 * - Accessible (ARIA labels, keyboard navigation)
 *
 * Usage:
 * <Button loading={isLoading} loadingText="Saving...">Save</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'default',
            size = 'md',
            loading = false,
            loadingText,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles = cn(
            'inline-flex items-center justify-center gap-2',
            'font-semibold rounded-lg transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
            'active:scale-95'
        );

        const variants = {
            default: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
            primary: 'bg-primary hover:bg-primary/90 text-black',
            secondary: 'bg-secondary hover:bg-secondary/90 text-black',
            ghost: 'hover:bg-white/10 text-white',
            destructive: 'bg-destructive hover:bg-destructive/90 text-white',
            outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
            link: 'text-primary underline-offset-4 hover:underline',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg',
            icon: 'h-10 w-10',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || loading}
                aria-busy={loading}
                aria-live="polite"
                {...props}
            >
                {loading && (
                    <Loader2
                        className={cn(
                            'animate-spin',
                            size === 'sm' && 'w-3 h-3',
                            size === 'md' && 'w-4 h-4',
                            size === 'lg' && 'w-5 h-5'
                        )}
                        aria-hidden="true"
                    />
                )}
                {loading && loadingText ? loadingText : children}
                {loading && <span className="sr-only">Loading...</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';

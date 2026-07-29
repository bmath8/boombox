'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary Component
 * Catches React errors and prevents entire app crash
 * Provides user-friendly fallback UI with recovery options
 */
export class ErrorBoundary extends Component<Props, State> {
    public override state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('React Error Boundary caught error:', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        });

        // TODO: Send to Sentry or error tracking service
        // Sentry.captureException(error, { contexts: { react: errorInfo } });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    private handleReload = () => {
        window.location.reload();
    };

    public override render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-muted border-4 border-destructive p-8 space-y-6">
                        <div className="space-y-2">
                            <h1 className="font-heading text-3xl text-destructive">
                                Something Went Wrong
                            </h1>
                            <p className="font-mono text-sm text-muted-foreground">
                                We encountered an unexpected error. Don't worry, your data is safe.
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="bg-background border-2 border-border p-4">
                                <p className="font-mono text-xs text-muted-foreground break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-4 py-3 bg-primary text-background font-heading hover:bg-secondary transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex-1 px-4 py-3 border-2 border-foreground text-foreground font-heading hover:bg-foreground hover:text-background transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>

                        <div className="pt-4 border-t-2 border-border">
                            <p className="font-mono text-xs text-muted-foreground">
                                If this problem persists, please contact support.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

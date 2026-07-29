import { toast } from 'sonner';
import { parseError, getErrorConfig } from './error-messages';

export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public userMessage: string,
        public originalError?: unknown
    ) {
        super(message);
        this.name = 'AppError';
    }
}

/**
 * Enhanced error handler with better user messages and actions
 */
export function handleError(error: unknown, context: string, showToast: boolean = true) {
    // Extract meaningful error details for logging
    let errorDetails: string;
    if (error instanceof Error) {
        errorDetails = error.message;
    } else if (typeof error === 'object' && error !== null) {
        const errObj = error as Record<string, unknown>;
        errorDetails = errObj['message'] as string || errObj['code'] as string || JSON.stringify(error);
    } else {
        errorDetails = String(error);
    }
    console.error(`[${context}] Error: ${errorDetails}`);

    // Parse error to get code and config
    const { code, config } = parseError(error);

    // Log to monitoring service (Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
            tags: { context, errorCode: code },
        });
    }

    // Show toast with action if available
    if (showToast) {
        toast.error(config.title, {
            description: config.message,
            action: config.action
                ? {
                    label: config.action.label,
                    onClick: config.action.onClick || (() => {
                        if (config.action?.href) {
                            window.location.href = config.action.href;
                        }
                    }),
                }
                : undefined,
            duration: 5000,
        });
    }

    return { code, userMessage: config.message, config };
}

/**
 * Create a custom error with a specific code
 */
export function createError(code: string, message: string, userMessage?: string) {
    return new AppError(message, code, userMessage || message);
}

/**
 * Show a specific error by code
 */
export function showError(code: string) {
    const config = getErrorConfig(code);
    toast.error(config.title, {
        description: config.message,
        action: config.action
            ? {
                label: config.action.label,
                onClick: config.action.onClick || (() => {
                    if (config.action?.href) {
                        window.location.href = config.action.href;
                    }
                }),
            }
            : undefined,
    });
}

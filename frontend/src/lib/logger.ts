import { env } from './env';
import * as Sentry from '@sentry/nextjs';

const isDev = env.NODE_ENV === 'development';
const isProd = env.NODE_ENV === 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private formatMessage(level: LogLevel, message: string, data?: unknown) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        if (data) {
            return [prefix, message, data];
        }
        return [prefix, message];
    }

    info(message: string, data?: unknown) {
        console.log(...this.formatMessage('info', message, data));

        // Send to Sentry as breadcrumb in production
        if (isProd) {
            Sentry.addBreadcrumb({
                message,
                level: 'info',
                data: data as Record<string, unknown>,
            });
        }
    }

    warn(message: string, data?: unknown) {
        console.warn(...this.formatMessage('warn', message, data));

        // Capture warnings in production
        if (isProd) {
            Sentry.captureMessage(message, {
                level: 'warning',
                extra: data as Record<string, unknown>,
            });
        }
    }

    error(message: string, error?: unknown) {
        // Always log errors
        console.error(...this.formatMessage('error', message, error));

        // Send to Sentry in production
        if (isProd) {
            if (error instanceof Error) {
                Sentry.captureException(error, {
                    contexts: {
                        errorContext: {
                            message,
                        },
                    },
                });
            } else {
                Sentry.captureMessage(message, {
                    level: 'error',
                    extra: {
                        error: error as Record<string, unknown>,
                    },
                });
            }
        }
    }

    debug(message: string, data?: unknown) {
        if (isDev) {
            console.debug(...this.formatMessage('debug', message, data));
        }

        // Add as breadcrumb even in production for error context
        Sentry.addBreadcrumb({
            message,
            level: 'debug',
            data: data as Record<string, unknown>,
        });
    }

    /**
     * Set user context for error tracking
     */
    setUser(userId: string, email?: string) {
        if (isProd) {
            Sentry.setUser({
                id: userId,
                ...(email ? { email } : {}),
            });
        }
    }

    /**
     * Clear user context (on logout)
     */
    clearUser() {
        if (isProd) {
            Sentry.setUser(null);
        }
    }

    /**
     * Add custom context for debugging
     */
    addContext(key: string, value: Record<string, unknown>) {
        if (isProd) {
            Sentry.setContext(key, value);
        }
    }
}

export const logger = new Logger();

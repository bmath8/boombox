/**
 * Sentry Client Configuration
 * Monitors client-side errors and performance
 */

import * as Sentry from '@sentry/nextjs';

declare const process: { env: { [key: string]: string | undefined } };

const SENTRY_DSN = process.env['NEXT_PUBLIC_SENTRY_DSN'];
const ENVIRONMENT = process.env['NODE_ENV'] || 'development';

// Only initialize Sentry in production or if DSN is explicitly provided
if (SENTRY_DSN && (ENVIRONMENT === 'production' || process.env['SENTRY_ENABLED'] === 'true')) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Capture 100% of errors
    sampleRate: 1.0,

    // Session Replay
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
    replaysSessionSampleRate: 0.1, // Capture 10% of all sessions

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            // Remove tokens and keys
            delete breadcrumb.data['token'];
            delete breadcrumb.data['apiKey'];
            delete breadcrumb.data['password'];
          }
          return breadcrumb;
        });
      }

      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extension errors
      'top.GLOBALS',
      // Random plugins/extensions
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Network errors
      'NetworkError',
      'Network request failed',
      // Aborted requests
      'AbortError',
      'The operation was aborted',
      // WebSocket normal closures
      'WebSocket connection closed',
    ],

    // Set tags
    initialScope: {
      tags: {
        appVersion: process.env['NEXT_PUBLIC_APP_VERSION'] || 'unknown',
      },
    },
  });

  console.log('✅ Sentry initialized (client)');
} else {
  console.log('ℹ️ Sentry not initialized (no DSN or not in production)');
}

/**
 * Sentry Server Configuration
 * Monitors server-side errors and performance
 */

import * as Sentry from '@sentry/nextjs';

declare const process: { env: { [key: string]: string | undefined }; version: string };

const SENTRY_DSN = process.env['NEXT_PUBLIC_SENTRY_DSN'];
const ENVIRONMENT = process.env['NODE_ENV'] || 'development';

// Only initialize Sentry in production or if DSN is explicitly provided
if (SENTRY_DSN && (ENVIRONMENT === 'production' || process.env['SENTRY_ENABLED'] === 'true')) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Adjust this value in production, or use tracesSampler for finer control
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Capture 100% of errors
    sampleRate: 1.0,

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from request
      if (event.request) {
        // Remove query parameters that might contain sensitive data
        if (event.request.query_string) {
          const params = new URLSearchParams(event.request.query_string);
          params.delete('token');
          params.delete('apiKey');
          params.delete('password');
          event.request.query_string = params.toString();
        }

        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
          delete event.request.headers['X-API-Key'];
        }

        // Remove sensitive cookies
        if (event.request.cookies) {
          delete event.request.cookies['sb-access-token'];
          delete event.request.cookies['sb-refresh-token'];
        }
      }

      // Remove sensitive environment variables
      if (event.contexts?.['runtime']?.['environment']) {
        const sensitiveKeys = [
          'JWT_SECRET',
          'SUPABASE_SERVICE_ROLE_KEY',
          'SPOTIFY_CLIENT_SECRET',
          'DATABASE_URL',
          'REDIS_URL',
        ];

        const env = event.contexts['runtime']['environment'] as Record<string, unknown>;
        sensitiveKeys.forEach(key => {
          delete env[key];
        });
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Database connection errors (temporary)
      'ECONNREFUSED',
      // Rate limit errors (expected)
      'Rate limit exceeded',
      // Auth errors (user-caused)
      'Unauthorized',
      'Authentication failed',
    ],

    // Set tags
    initialScope: {
      tags: {
        appVersion: process.env['NEXT_PUBLIC_APP_VERSION'] || 'unknown',
        nodeVersion: process.version,
      },
    },
  });

  console.log('✅ Sentry initialized (server)');
} else {
  console.log('ℹ️ Sentry not initialized (no DSN or not in production)');
}

/**
 * OAuth State Management - Client Side
 * Client-safe state generation for CSRF protection
 */

/**
 * Client-side state generation (for use in browser)
 */
export function generateClientOAuthState(): string {
    if (typeof window !== 'undefined' && window.crypto) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return Array.from({ length: 32 }, () =>
        Math.random().toString(36).charAt(2)
    ).join('');
}

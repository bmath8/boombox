/**
 * Comprehensive Input Validation & Sanitization
 * Protects against XSS, SQL injection, and other injection attacks
 */

import { z } from 'zod';

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

/**
 * Validates and sanitizes user display name
 */
export const displayNameSchema = z.string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Display name can only contain letters, numbers, spaces, hyphens, and underscores')
    .transform(str => str.trim());

/**
 * Validates email address
 */
export const emailSchema = z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .transform(str => str.trim());

/**
 * Validates UUID format
 */
export const uuidSchema = z.string()
    .uuid('Invalid UUID format');

/**
 * Validates station name
 */
export const stationNameSchema = z.string()
    .min(1, 'Station name is required')
    .max(100, 'Station name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_!?']+$/, 'Station name contains invalid characters')
    .transform(str => str.trim());

/**
 * Validates station description (allows more characters)
 */
export const stationDescriptionSchema = z.string()
    .max(500, 'Description must be less than 500 characters')
    .transform(str => str.trim())
    .optional();

/**
 * Validates chat message
 */
export const chatMessageSchema = z.string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message must be less than 500 characters')
    .regex(/^[^<>{}]*$/, 'Message contains invalid characters')
    .transform(str => str.trim());

/**
 * Validates playlist name
 */
export const playlistNameSchema = z.string()
    .min(1, 'Playlist name is required')
    .max(200, 'Playlist name must be less than 200 characters')
    .transform(str => str.trim());

/**
 * Validates Spotify track ID
 */
export const spotifyTrackIdSchema = z.string()
    .regex(/^[a-zA-Z0-9]{22}$/, 'Invalid Spotify track ID');

/**
 * Validates Spotify playlist ID
 */
export const spotifyPlaylistIdSchema = z.string()
    .regex(/^[a-zA-Z0-9]{22}$/, 'Invalid Spotify playlist ID');

/**
 * Validates search query
 */
export const searchQuerySchema = z.string()
    .min(1, 'Search query cannot be empty')
    .max(200, 'Search query must be less than 200 characters')
    .transform(str => str.trim());

/**
 * Validates pagination parameters
 */
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Validates date range
 */
export const dateRangeSchema = z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
}).refine(data => data.startDate <= data.endDate, {
    message: 'Start date must be before end date',
});

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitizes HTML content to prevent XSS
 * Uses a whitelist approach
 */
export function sanitizeHtml(dirty: string): string {
    // Remove all HTML tags
    return dirty
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, '&');
}

/**
 * Sanitizes user input for display
 * Escapes special characters
 */
export function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes SQL-like input (for search queries)
 * Removes potential SQL injection characters
 */
export function sanitizeSqlInput(input: string): string {
    return input
        .replace(/[;'"\\]/g, '') // Remove SQL metacharacters
        .replace(/--/g, '')       // Remove SQL comments
        .replace(/\/\*/g, '')     // Remove multiline comments
        .trim();
}

/**
 * Sanitizes filename
 * Removes potentially dangerous characters
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.{2,}/g, '.')
        .substring(0, 255);
}

/**
 * Sanitizes URL
 * Validates and ensures safe URL protocols
 */
export function sanitizeUrl(url: string): string {
    try {
        const parsed = new URL(url);

        // Only allow http and https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Invalid protocol');
        }

        return parsed.toString();
    } catch {
        return '#';
    }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates input and returns sanitized result
 * @param schema - Zod schema to validate against
 * @param input - Input to validate
 * @returns Validated and sanitized data
 * @throws ZodError if validation fails
 */
export function validateAndSanitize<T>(
    schema: z.ZodSchema<T>,
    input: unknown
): T {
    return schema.parse(input);
}

/**
 * Safely validates input and returns result or null
 * @param schema - Zod schema to validate against
 * @param input - Input to validate
 * @returns Validated data or null if invalid
 */
export function safeValidate<T>(
    schema: z.ZodSchema<T>,
    input: unknown
): T | null {
    const result = schema.safeParse(input);
    return result.success ? result.data : null;
}

/**
 * Validates input and returns detailed error messages
 * @param schema - Zod schema to validate against
 * @param input - Input to validate
 * @returns Validation result with data or errors
 */
export function validateWithErrors<T>(
    schema: z.ZodSchema<T>,
    input: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(input);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Format errors for easy display
    const errors: Record<string, string> = {};
    result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    });

    return { success: false, errors };
}

// ============================================================================
// API REQUEST VALIDATION
// ============================================================================

/**
 * Validates API request body
 */
export async function validateRequestBody<T>(
    request: Request,
    schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
        const body = await request.json();
        const validated = schema.parse(body);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            return {
                success: false,
                error: firstError?.message || 'Validation failed',
            };
        }

        return {
            success: false,
            error: 'Invalid request body',
        };
    }
}

/**
 * Validates query parameters from URL
 */
export function validateQueryParams<T>(
    searchParams: URLSearchParams,
    schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
    try {
        const params = Object.fromEntries(searchParams.entries());
        const validated = schema.parse(params);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            return {
                success: false,
                error: firstError?.message || 'Invalid query parameters',
            };
        }

        return {
            success: false,
            error: 'Invalid query parameters',
        };
    }
}

// ============================================================================
// COMMON API SCHEMAS
// ============================================================================

/**
 * Schema for creating a radio station
 */
export const createStationSchema = z.object({
    stationName: stationNameSchema,
    description: stationDescriptionSchema,
    genre: z.string().max(50).optional(),
    privacy: z.enum(['public', 'friends', 'private']).default('friends'),
});

/**
 * Schema for sending a chat message
 */
export const sendChatMessageSchema = z.object({
    stationId: uuidSchema,
    message: chatMessageSchema,
});

/**
 * Schema for creating a playlist
 */
export const createPlaylistSchema = z.object({
    name: playlistNameSchema,
    description: z.string().max(500).optional(),
    isPublic: z.boolean().default(false),
    collaborative: z.boolean().default(false),
});

/**
 * Schema for adding a track to playlist
 */
export const addTrackToPlaylistSchema = z.object({
    playlistId: uuidSchema,
    trackId: spotifyTrackIdSchema,
});

/**
 * Schema for friend request
 */
export const friendRequestSchema = z.object({
    friendId: uuidSchema,
});

/**
 * Schema for search
 */
export const searchSchema = z.object({
    query: searchQuerySchema,
    type: z.enum(['all', 'tracks', 'artists', 'albums', 'playlists', 'users', 'stations']).default('all'),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

// Export types for TypeScript
export type CreateStationInput = z.infer<typeof createStationSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type AddTrackToPlaylistInput = z.infer<typeof addTrackToPlaylistSchema>;
export type FriendRequestInput = z.infer<typeof friendRequestSchema>;
export type SearchInput = z.infer<typeof searchSchema>;

/**
 * Input Sanitization Utilities
 * Protects against XSS and injection attacks
 */

const validator = require('validator');

/**
 * Sanitize chat message
 * - Escape HTML entities
 * - Remove dangerous characters
 * - Trim whitespace
 */
function sanitizeChatMessage(message) {
    if (typeof message !== 'string') {
        throw new Error('Message must be a string');
    }

    // Trim whitespace
    let sanitized = message.trim();

    // Escape HTML entities to prevent XSS
    sanitized = validator.escape(sanitized);

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Limit consecutive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
}

/**
 * Validate chat message length and content
 */
function validateChatMessage(message, maxLength = 500) {
    if (!message || typeof message !== 'string') {
        return { valid: false, error: 'Message is required' };
    }

    if (message.length === 0) {
        return { valid: false, error: 'Message cannot be empty' };
    }

    if (message.length > maxLength) {
        return { valid: false, error: `Message exceeds ${maxLength} characters` };
    }

    // Check for common spam patterns
    const spamPatterns = [
        /(.)\1{10,}/i, // Repeated characters (10+)
        /http[s]?:\/\/[^\s]{100,}/i, // Very long URLs
    ];

    for (const pattern of spamPatterns) {
        if (pattern.test(message)) {
            return { valid: false, error: 'Message contains spam patterns' };
        }
    }

    return { valid: true };
}

/**
 * Sanitize station name
 */
function sanitizeStationName(name) {
    if (typeof name !== 'string') {
        throw new Error('Station name must be a string');
    }

    // Trim and escape
    let sanitized = validator.escape(name.trim());

    // Remove special characters except spaces, hyphens, and underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_]/g, '');

    return sanitized;
}

/**
 * Validate UUID format
 */
function validateUUID(uuid) {
    return validator.isUUID(uuid);
}

/**
 * Sanitize URL
 */
function sanitizeURL(url) {
    if (!validator.isURL(url, {
        protocols: ['http', 'https'],
        require_protocol: true
    })) {
        throw new Error('Invalid URL');
    }

    return validator.escape(url);
}

module.exports = {
    sanitizeChatMessage,
    validateChatMessage,
    sanitizeStationName,
    validateUUID,
    sanitizeURL,
};

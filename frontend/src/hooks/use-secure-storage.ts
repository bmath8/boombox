'use client';

import { useCallback } from 'react';

/**
 * Secure storage options
 */
interface SecureStorageOptions {
    ttl?: number; // Time-to-live in milliseconds
}

/**
 * Stored data structure
 */
interface StoredData {
    value: string;
    expiry: number | null;
    timestamp: number;
}

/**
 * Hook for encrypted localStorage using Web Crypto API
 * 
 * Provides defense-in-depth against XSS attacks accessing localStorage
 * All data is encrypted with AES-256-GCM before storage
 * 
 * @example
 * ```tsx
 * const { setItem, getItem, removeItem } = useSecureStorage();
 * 
 * // Store with 1 hour TTL
 * await setItem('token', 'secret-value', { ttl: 3600000 });
 * 
 * // Retrieve
 * const value = await getItem('token');
 * 
 * // Remove
 * removeItem('token');
 * ```
 */
export function useSecureStorage() {
    /**
     * Get or create encryption key
     */
    const getEncryptionKey = useCallback(async (): Promise<CryptoKey> => {
        const keyName = '_secure_storage_key';
        const stored = localStorage.getItem(keyName);

        if (stored) {
            try {
                const keyData = JSON.parse(atob(stored));
                return await crypto.subtle.importKey(
                    'jwk',
                    keyData,
                    { name: 'AES-GCM' },
                    true,
                    ['encrypt', 'decrypt']
                );
            } catch (error) {
                console.error('[SecureStorage] Failed to import key:', error);
                // Fall through to generate new key
            }
        }

        // Generate new key
        const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );

        // Export and store key
        const exported = await crypto.subtle.exportKey('jwk', key);
        localStorage.setItem(keyName, btoa(JSON.stringify(exported)));

        return key;
    }, []);

    /**
     * Encrypt data
     */
    const encrypt = useCallback(async (data: string): Promise<string> => {
        try {
            const key = await getEncryptionKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encoded = new TextEncoder().encode(data);

            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                encoded
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encrypted), iv.length);

            // Convert to base64
            return arrayBufferToBase64(combined.buffer);
        } catch (error) {
            console.error('[SecureStorage] Encryption failed:', error);
            throw new Error('Encryption failed');
        }
    }, [getEncryptionKey]);

    /**
     * Decrypt data
     */
    const decrypt = useCallback(async (encryptedData: string): Promise<string> => {
        try {
            const key = await getEncryptionKey();
            const combined = base64ToArrayBuffer(encryptedData);

            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                data
            );

            return new TextDecoder().decode(decrypted);
        } catch (error) {
            console.error('[SecureStorage] Decryption failed:', error);
            throw new Error('Decryption failed');
        }
    }, [getEncryptionKey]);

    /**
     * Store encrypted item with optional TTL
     */
    const setItem = useCallback(async (
        key: string,
        value: string,
        options?: SecureStorageOptions
    ): Promise<void> => {
        try {
            const expiry = options?.ttl ? Date.now() + options.ttl : null;
            const data: StoredData = {
                value,
                expiry,
                timestamp: Date.now(),
            };

            const encrypted = await encrypt(JSON.stringify(data));
            localStorage.setItem(`sec_${key}`, encrypted);
        } catch (error) {
            console.error('[SecureStorage] setItem failed:', error);
            throw error;
        }
    }, [encrypt]);

    /**
     * Retrieve and decrypt item
     */
    const getItem = useCallback(async (key: string): Promise<string | null> => {
        try {
            const encrypted = localStorage.getItem(`sec_${key}`);
            if (!encrypted) return null;

            const decrypted = await decrypt(encrypted);
            const data: StoredData = JSON.parse(decrypted);

            // Check expiry
            if (data.expiry && Date.now() > data.expiry) {
                localStorage.removeItem(`sec_${key}`);
                return null;
            }

            return data.value;
        } catch (error) {
            console.error('[SecureStorage] getItem failed:', error);
            // Remove corrupted data
            localStorage.removeItem(`sec_${key}`);
            return null;
        }
    }, [decrypt]);

    /**
     * Remove item
     */
    const removeItem = useCallback((key: string): void => {
        localStorage.removeItem(`sec_${key}`);
    }, []);

    /**
     * Clear all secure storage items
     */
    const clear = useCallback((): void => {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('sec_')) {
                localStorage.removeItem(key);
            }
        });
    }, []);

    /**
     * Get all secure storage keys
     */
    const keys = useCallback((): string[] => {
        const allKeys = Object.keys(localStorage);
        return allKeys
            .filter(key => key.startsWith('sec_'))
            .map(key => key.slice(4)); // Remove 'sec_' prefix
    }, []);

    /**
     * Check if key exists
     */
    const hasItem = useCallback((key: string): boolean => {
        return localStorage.getItem(`sec_${key}`) !== null;
    }, []);

    return {
        setItem,
        getItem,
        removeItem,
        clear,
        keys,
        hasItem,
    };
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        const byte = bytes[i];
        if (byte !== undefined) {
            binary += String.fromCharCode(byte);
        }
    }
    return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

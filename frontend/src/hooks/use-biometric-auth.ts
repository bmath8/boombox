'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Biometric authentication availability
 */
interface BiometricAvailability {
    available: boolean;
    type: 'platform' | 'cross-platform' | null;
    error?: string;
}

/**
 * Credential registration options
 */
interface RegistrationOptions {
    userId: string;
    userName: string;
    userEmail: string;
    userDisplayName?: string;
}

/**
 * Authentication result
 */
interface AuthResult {
    success: boolean;
    credentialId?: string;
    error?: string;
}

/**
 * Hook for biometric authentication using WebAuthn API
 * 
 * Supports:
 * - Face ID / Touch ID (iOS)
 * - Fingerprint / Face Unlock (Android)
 * - Windows Hello (Desktop)
 * 
 * @example
 * ```tsx
 * const { available, register, authenticate } = useBiometricAuth();
 * 
 * // Register biometric credential
 * await register({
 *   userId: 'user-123',
 *   userName: 'john@example.com',
 *   userEmail: 'john@example.com',
 * });
 * 
 * // Authenticate with biometrics
 * const result = await authenticate();
 * ```
 */
export function useBiometricAuth() {
    const [availability, setAvailability] = useState<BiometricAvailability>({
        available: false,
        type: null,
    });
    const [loading, setLoading] = useState(false);

    // Check if WebAuthn is available
    useEffect(() => {
        checkAvailability();
    }, []);

    const checkAvailability = useCallback(async () => {
        if (typeof window === 'undefined') {
            setAvailability({ available: false, type: null });
            return;
        }

        // Check for WebAuthn support
        if (!window.PublicKeyCredential) {
            setAvailability({
                available: false,
                type: null,
                error: 'WebAuthn not supported',
            });
            return;
        }

        try {
            // Check for platform authenticator (built-in biometrics)
            const platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

            if (platformAvailable) {
                setAvailability({
                    available: true,
                    type: 'platform',
                });
            } else {
                // Check for cross-platform authenticators (security keys)
                setAvailability({
                    available: true,
                    type: 'cross-platform',
                });
            }
        } catch (error) {
            console.error('[BiometricAuth] Availability check failed:', error);
            setAvailability({
                available: false,
                type: null,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }, []);

    /**
     * Register a new biometric credential
     */
    const register = useCallback(async (options: RegistrationOptions): Promise<AuthResult> => {
        if (!availability.available) {
            return {
                success: false,
                error: 'Biometric authentication not available',
            };
        }

        setLoading(true);

        try {
            // Generate challenge (in production, get from server)
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            // Convert user ID to buffer
            const userIdBuffer = new TextEncoder().encode(options.userId);

            // Create credential
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: {
                        name: 'BOOMBOX',
                        id: window.location.hostname,
                    },
                    user: {
                        id: userIdBuffer,
                        name: options.userName,
                        displayName: options.userDisplayName || options.userName,
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: 'public-key' },   // ES256
                        { alg: -257, type: 'public-key' }, // RS256
                    ],
                    authenticatorSelection: {
                        ...(availability.type === 'platform' ? { authenticatorAttachment: 'platform' as const } : {}),
                        userVerification: 'required' as const,
                        residentKey: 'preferred' as const,
                    },
                    timeout: 60000,
                    attestation: 'none',
                },
            }) as PublicKeyCredential;

            if (!credential) {
                throw new Error('Credential creation failed');
            }

            // Store credential ID in localStorage (in production, send to server)
            const credentialId = arrayBufferToBase64(credential.rawId);
            localStorage.setItem('biometric_credential_id', credentialId);
            localStorage.setItem('biometric_user_id', options.userId);

            setLoading(false);

            return {
                success: true,
                credentialId,
            };
        } catch (error) {
            console.error('[BiometricAuth] Registration failed:', error);
            setLoading(false);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Registration failed',
            };
        }
    }, [availability]);

    /**
     * Authenticate using registered biometric credential
     */
    const authenticate = useCallback(async (): Promise<AuthResult> => {
        if (!availability.available) {
            return {
                success: false,
                error: 'Biometric authentication not available',
            };
        }

        // Check if credential exists
        const storedCredentialId = localStorage.getItem('biometric_credential_id');
        if (!storedCredentialId) {
            return {
                success: false,
                error: 'No biometric credential registered',
            };
        }

        setLoading(true);

        try {
            // Generate challenge (in production, get from server)
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            // Convert credential ID back to buffer
            const credentialIdBuffer = base64ToArrayBuffer(storedCredentialId);

            // Get credential
            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    rpId: window.location.hostname,
                    allowCredentials: [
                        {
                            id: credentialIdBuffer,
                            type: 'public-key',
                            transports: ['internal'],
                        },
                    ],
                    userVerification: 'required',
                    timeout: 60000,
                },
            }) as PublicKeyCredential;

            if (!assertion) {
                throw new Error('Authentication failed');
            }

            setLoading(false);

            // In production, send assertion to server for verification
            // For now, we'll just return success
            return {
                success: true,
                credentialId: storedCredentialId,
            };
        } catch (error) {
            console.error('[BiometricAuth] Authentication failed:', error);
            setLoading(false);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Authentication failed',
            };
        }
    }, [availability]);

    /**
     * Remove registered biometric credential
     */
    const remove = useCallback(async (): Promise<void> => {
        localStorage.removeItem('biometric_credential_id');
        localStorage.removeItem('biometric_user_id');
    }, []);

    /**
     * Check if biometric is registered for current user
     */
    const isRegistered = useCallback((): boolean => {
        return !!localStorage.getItem('biometric_credential_id');
    }, []);

    return {
        available: availability.available,
        type: availability.type,
        error: availability.error,
        loading,
        register,
        authenticate,
        remove,
        isRegistered: isRegistered(),
        checkAvailability,
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

'use client';

import { useState, useEffect } from 'react';

/**
 * Network connection type
 */
export type ConnectionType =
    | 'wifi'
    | 'cellular'
    | 'ethernet'
    | 'bluetooth'
    | 'unknown'
    | 'none';

/**
 * Effective network type (connection speed)
 */
export type EffectiveType =
    | 'slow-2g'
    | '2g'
    | '3g'
    | '4g'
    | '5g'
    | 'unknown';

/**
 * Network information interface
 */
export interface NetworkInfo {
    isOnline: boolean;
    type: ConnectionType;
    effectiveType: EffectiveType;
    downlink: number | undefined;  // Mb/s
    rtt: number | undefined;       // Round-trip time in ms
    saveData: boolean;  // Data saver mode enabled
}

/**
 * Extended Navigator with Network Information API
 */
interface NavigatorWithConnection extends Navigator {
    connection?: {
        type?: string;
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
        addEventListener: (event: string, handler: () => void) => void;
        removeEventListener: (event: string, handler: () => void) => void;
    };
}

/**
 * Map browser connection types to our simplified types
 */
function mapConnectionType(type?: string): ConnectionType {
    if (!type) return 'unknown';

    if (type.includes('wifi')) return 'wifi';
    if (type.includes('cellular')) return 'cellular';
    if (type.includes('ethernet')) return 'ethernet';
    if (type.includes('bluetooth')) return 'bluetooth';

    return 'unknown';
}

/**
 * Map effective connection type
 */
function mapEffectiveType(type?: string): EffectiveType {
    if (!type) return 'unknown';

    const typeMap: Record<string, EffectiveType> = {
        'slow-2g': 'slow-2g',
        '2g': '2g',
        '3g': '3g',
        '4g': '4g',
        '5g': '5g',
    };

    return typeMap[type] || 'unknown';
}

/**
 * Hook for monitoring network status and connection quality
 * 
 * Provides real-time information about:
 * - Online/offline status
 * - Connection type (WiFi, cellular, etc.)
 * - Effective connection speed (2G, 3G, 4G, 5G)
 * - Data saver mode
 * - Connection quality metrics (downlink speed, RTT)
 * 
 * @returns Network information object
 * 
 * @example
 * ```tsx
 * const network = useNetworkStatus();
 * 
 * if (!network.isOnline) {
 *   return <OfflineMessage />;
 * }
 * 
 * if (network.saveData || network.effectiveType === '2g') {
 *   // Use lower quality assets
 * }
 * ```
 */
export function useNetworkStatus(): NetworkInfo {
    const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(() => {
        // Initialize with current state
        const nav = navigator as NavigatorWithConnection;
        const connection = nav.connection;

        return {
            isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
            type: mapConnectionType(connection?.type),
            effectiveType: mapEffectiveType(connection?.effectiveType),
            downlink: connection?.downlink,
            rtt: connection?.rtt,
            saveData: connection?.saveData ?? false,
        };
    });

    useEffect(() => {
        const updateNetworkInfo = () => {
            const nav = navigator as NavigatorWithConnection;
            const connection = nav.connection;

            setNetworkInfo({
                isOnline: navigator.onLine,
                type: mapConnectionType(connection?.type),
                effectiveType: mapEffectiveType(connection?.effectiveType),
                downlink: connection?.downlink,
                rtt: connection?.rtt,
                saveData: connection?.saveData ?? false,
            });
        };

        // Listen for online/offline events
        window.addEventListener('online', updateNetworkInfo);
        window.addEventListener('offline', updateNetworkInfo);

        // Listen for connection changes (if supported)
        const nav = navigator as NavigatorWithConnection;
        const connection = nav.connection;

        if (connection) {
            connection.addEventListener('change', updateNetworkInfo);
        }

        return () => {
            window.removeEventListener('online', updateNetworkInfo);
            window.removeEventListener('offline', updateNetworkInfo);

            if (connection) {
                connection.removeEventListener('change', updateNetworkInfo);
            }
        };
    }, []);

    return networkInfo;
}

/**
 * Hook that returns true if network is suitable for high-quality streaming
 * 
 * @returns boolean indicating if network is fast enough
 * 
 * @example
 * ```tsx
 * const canStreamHQ = useCanStreamHighQuality();
 * const quality = canStreamHQ ? 'high' : 'low';
 * ```
 */
export function useCanStreamHighQuality(): boolean {
    const network = useNetworkStatus();

    // Offline = can't stream
    if (!network.isOnline) {
        return false;
    }

    // Data saver mode = use low quality
    if (network.saveData) {
        return false;
    }

    // Check effective connection type
    const slowConnections: EffectiveType[] = ['slow-2g', '2g', '3g'];
    if (slowConnections.includes(network.effectiveType)) {
        return false;
    }

    return true;
}

/**
 * Hook that returns recommended streaming quality based on network
 * 
 * @returns Quality level: 'high' | 'medium' | 'low'
 * 
 * @example
 * ```tsx
 * const quality = useRecommendedQuality();
 * ```
 */
export function useRecommendedQuality(): 'high' | 'medium' | 'low' {
    const network = useNetworkStatus();

    if (!network.isOnline) {
        return 'low';
    }

    if (network.saveData) {
        return 'low';
    }

    switch (network.effectiveType) {
        case 'slow-2g':
        case '2g':
            return 'low';
        case '3g':
            return 'medium';
        case '4g':
        case '5g':
            return 'high';
        default:
            return 'medium';
    }
}

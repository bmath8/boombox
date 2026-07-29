'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Hook for detecting shake gestures using DeviceMotion API
 * 
 * Useful for "shake to shuffle" functionality
 */
export function useShakeDetection(onShake: () => void, threshold: number = 15) {
    const [isSupported, setIsSupported] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);

    useEffect(() => {
        if (!window.DeviceMotionEvent) {
            setIsSupported(false);
            return;
        }

        setIsSupported(true);

        let lastX = 0;
        let lastY = 0;
        let lastZ = 0;
        let lastTime = Date.now();

        const handleMotion = (event: DeviceMotionEvent) => {
            if (!isEnabled) return;

            const acceleration = event.accelerationIncludingGravity;
            if (!acceleration) return;

            const currentTime = Date.now();
            const timeDiff = currentTime - lastTime;

            if (timeDiff > 100) { // Check every 100ms
                const x = acceleration.x ?? 0;
                const y = acceleration.y ?? 0;
                const z = acceleration.z ?? 0;

                const deltaX = Math.abs(x - lastX);
                const deltaY = Math.abs(y - lastY);
                const deltaZ = Math.abs(z - lastZ);

                if (deltaX > threshold || deltaY > threshold || deltaZ > threshold) {
                    onShake();
                }

                lastX = x;
                lastY = y;
                lastZ = z;
                lastTime = currentTime;
            }
        };

        window.addEventListener('devicemotion', handleMotion);

        return () => {
            window.removeEventListener('devicemotion', handleMotion);
        };
    }, [onShake, threshold, isEnabled]);

    const toggleEnabled = useCallback(() => {
        setIsEnabled(prev => !prev);
    }, []);

    return {
        isSupported,
        isEnabled,
        toggleEnabled,
    };
}

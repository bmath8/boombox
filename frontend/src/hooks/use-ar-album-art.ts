'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Configuration for the tilt effect intensity
const TILT_MAX_DEGREE = 15;
const TRANSITION_MS = 100;

/**
 * Hook for Premium 3D Parallax/Tilt Art Effect
 * 
 * Instead of WebXR (which is niche), this provides a high-end "Apple Music" style
 * parallax tilt effect that responds to mouse movement and device orientation (gyro).
 */
export function useARAlbumArt() {
    // We keep the name "AR" as per user request/codebase consistency, 
    // but the implementation is now "Tangible 3D Art"

    const [transformStyle, setTransformStyle] = useState({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: `transform ${TRANSITION_MS}ms ease-out`
    });

    const [glareStyle, setGlareStyle] = useState({
        opacity: 0,
        transform: 'translate(0%, 0%)'
    });

    const isHovering = useRef(false);

    // Mouse Move Handler (Desktop)
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
        if (!isHovering.current) return;

        const target = e.currentTarget as HTMLElement;
        if (!target) return;

        // Get dimensions
        const rect = target.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Calculate mouse position relative to center (0 to 1)
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5; // -0.5 to 0.5
        const yPct = mouseY / height - 0.5; // -0.5 to 0.5

        // Calculate rotation
        // RotateY follows X axis movement (left/right)
        // RotateX follows Y axis movement (up/down) - inverted for natural tilt
        const rotateY = xPct * TILT_MAX_DEGREE * 2;
        const rotateX = -yPct * TILT_MAX_DEGREE * 2;

        setTransformStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`,
            transition: 'transform 50ms linear' // Fast response
        });

        // Glare effect moves opposite to tilt
        setGlareStyle({
            opacity: 0.4 + (Math.abs(xPct) + Math.abs(yPct)) * 0.5,
            transform: `translate(${xPct * 50}%, ${yPct * 50}%) rotate(${xPct * 45}deg)`
        });

    }, []);

    const handleMouseEnter = useCallback(() => {
        isHovering.current = true;
    }, []);

    const handleMouseLeave = useCallback(() => {
        isHovering.current = false;
        // Reset
        setTransformStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
            transition: `transform ${TRANSITION_MS * 4}ms ease-out`
        });
        setGlareStyle({
            opacity: 0,
            transform: 'translate(0, 0)'
        });
    }, []);

    // Gyroscope Handler (Mobile)
    useEffect(() => {
        // Only active if motion sensors are available
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (!isHovering.current) return; // Only tilt if "active" or focused? 
            // Actually for mobile, always-on subtle tilt is nice.

            const beta = e.beta || 0; // X-axis tilt (-180 to 180)
            const gamma = e.gamma || 0; // Y-axis tilt (-90 to 90)

            // Clamp values
            const rotateX = Math.min(Math.max(beta / 2, -15), 15);
            const rotateY = Math.min(Math.max(gamma / 1.5, -15), 15);

            setTransformStyle({
                transform: `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale(1)`,
                transition: 'transform 200ms ease-out'
            });

            // Subtle glare
            setGlareStyle({
                opacity: 0.3,
                transform: `translate(${gamma}%, ${beta}%)`
            });
        };

        if (window.DeviceOrientationEvent && /Mobi|Android/i.test(navigator.userAgent)) {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    return {
        // Transform props to spread onto the container
        tiltProps: {
            onMouseMove: handleMouseMove,
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            style: {
                ...transformStyle,
                transformStyle: 'preserve-3d', // Crucial for 3D depth
                willChange: 'transform'
            } as React.CSSProperties
        },
        // Props for the glare overlay layer
        glareProps: {
            style: {
                ...glareStyle,
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 60%)',
                pointerEvents: 'none',
                mixBlendMode: 'overlay',
                willChange: 'transform, opacity'
            } as React.CSSProperties
        },
        isARActive: true // Always "active" in this mode
    };
}

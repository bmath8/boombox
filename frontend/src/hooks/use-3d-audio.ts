'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface SpatialAudioSettings {
    enabled: boolean;
    azimuth: number; // -180 to 180 degrees (Horizontal)
    elevation: number; // -90 to 90 degrees (Vertical)
    distance: number; // 0 to 10
}

/**
 * Hook for 3D/Spatial Audio using Web Audio API
 * 
 * Creates a PannerNode graph: Source -> Panner -> Destination
 */
export function use3DAudio(audioElement: HTMLAudioElement | null) {
    const [settings, setSettings] = useState<SpatialAudioSettings>({
        enabled: false,
        azimuth: 0,
        elevation: 0,
        distance: 1,
    });

    const contextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const pannerRef = useRef<PannerNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);

    // Initialize Audio Graph
    useEffect(() => {
        if (!audioElement) return;

        const initAudio = () => {
            // 1. Create Context (only once)
            if (!contextRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                contextRef.current = new AudioContextClass();
            }
            const ctx = contextRef.current!;

            // 2. Create Source (only once)
            if (!sourceRef.current) {
                // Check if element already has a source attached to avoid error
                // In React, strict mode might trigger this twice. 
                // We'll trust the ref check.
                try {
                    sourceRef.current = ctx.createMediaElementSource(audioElement);
                } catch (e) {
                    console.warn('[3D Audio] Source node already connected', e);
                    return;
                }
            }

            // 3. Create Nodes
            if (!pannerRef.current) {
                pannerRef.current = ctx.createPanner();
                pannerRef.current.panningModel = 'HRTF'; // Quality 3D
                pannerRef.current.distanceModel = 'inverse';
                pannerRef.current.refDistance = 1;
                pannerRef.current.maxDistance = 10000;
                pannerRef.current.rolloffFactor = 1;
            }

            if (!gainRef.current) {
                gainRef.current = ctx.createGain();
            }

            // 4. Default Connection (Bypass 3D initially)
            // Source -> Gain -> Destination
            sourceRef.current.disconnect();
            sourceRef.current.connect(gainRef.current!).connect(ctx.destination);
        };

        // Initialize on user interaction usually, but here we prep it
        initAudio();

        return () => {
            // Cleanup NOT strictly necessary for global audio context, 
            // but strict node management is good.
            // We generally don't close the global context in a SPA.
        };
    }, [audioElement]);

    // Update Panner Position
    const updatePanner = useCallback((azimuth: number, elevation: number, distance: number) => {
        if (!pannerRef.current || !contextRef.current) return;

        // Convert degrees to radians
        const azRad = (azimuth * Math.PI) / 180;
        const elRad = (elevation * Math.PI) / 180;

        // Cartesian coordinates for PannerNode
        // X = left/right (sin az)
        // Y = up/down (sin el)
        // Z = front/back (cos az)

        // Note: Web Audio coords are X=Right, Y=Up, Z=Back (away from screen)
        // We'll map easier mental model:
        const x = Math.sin(azRad) * distance;
        const z = -Math.cos(azRad) * distance; // Negative Z is "in front"
        const y = Math.sin(elRad) * distance;

        const panner = pannerRef.current;

        // Smooth transition
        const t = contextRef.current.currentTime + 0.1;
        panner.positionX.linearRampToValueAtTime(x, t);
        panner.positionY.linearRampToValueAtTime(y, t);
        panner.positionZ.linearRampToValueAtTime(z, t);
    }, []);

    // Toggle Effect
    const enable3D = useCallback((enabled: boolean) => {
        setSettings(prev => ({ ...prev, enabled }));

        if (!sourceRef.current || !pannerRef.current || !gainRef.current || !contextRef.current) return;

        const ctx = contextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const source = sourceRef.current;
        const panner = pannerRef.current;
        const gain = gainRef.current;

        // Disconnect everything first
        source.disconnect();
        panner.disconnect();
        gain.disconnect();

        if (enabled) {
            // Route: Source -> Panner -> Gain -> Dest
            source.connect(panner);
            panner.connect(gain);
            gain.connect(ctx.destination);

            // Sync initial position
            updatePanner(settings.azimuth, settings.elevation, settings.distance);
        } else {
            // Route: Source -> Gain -> Dest (Flat)
            source.connect(gain);
            gain.connect(ctx.destination);
        }
    }, [settings.azimuth, settings.elevation, settings.distance, updatePanner]);

    const setPosition = useCallback((azimuth: number, elevation: number, distance: number) => {
        setSettings(prev => ({ ...prev, azimuth, elevation, distance }));
        if (settings.enabled) {
            updatePanner(azimuth, elevation, distance);
        }
    }, [settings.enabled, updatePanner]);

    const rotateAround = useCallback((speed: number = 1) => {
        // Stop any existing animation if we wanted to manage that state
        // For now, this just starts a loop
        let angle = settings.azimuth;
        const interval = setInterval(() => {
            angle = (angle + speed) % 360;
            // Update state without triggering full re-render loop if possible, 
            // but for React state syncing we call setPosition
            setPosition(angle, settings.elevation, settings.distance);
        }, 50);

        return () => clearInterval(interval);
    }, [settings.azimuth, settings.elevation, settings.distance, setPosition]);

    return {
        settings,
        enable3D,
        setPosition,
        rotateAround,
    };
}

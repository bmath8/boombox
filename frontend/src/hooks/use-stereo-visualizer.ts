'use client';

import { useEffect, useRef, useState } from 'react';

interface StereoVisualizerData {
    leftChannel: Uint8Array;
    rightChannel: Uint8Array;
    balance: number; // -1 (left) to 1 (right)
}

/**
 * Hook for stereo audio visualization
 * 
 * Analyzes left and right channels separately using Web Audio API
 */
export function useStereoVisualizer(audioElement: HTMLAudioElement | null) {
    const [visualizerData, setVisualizerData] = useState<StereoVisualizerData>({
        leftChannel: new Uint8Array(0),
        rightChannel: new Uint8Array(0),
        balance: 0,
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const splitterRef = useRef<ChannelSplitterNode | null>(null);
    const leftAnalyserRef = useRef<AnalyserNode | null>(null);
    const rightAnalyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!audioElement) return;

        try {
            // Initialize Web Audio API
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioContext = audioContextRef.current;

            sourceNodeRef.current = audioContext.createMediaElementSource(audioElement);
            splitterRef.current = audioContext.createChannelSplitter(2);
            leftAnalyserRef.current = audioContext.createAnalyser();
            rightAnalyserRef.current = audioContext.createAnalyser();

            // Configure analysers
            leftAnalyserRef.current.fftSize = 256;
            rightAnalyserRef.current.fftSize = 256;

            // Connect nodes
            sourceNodeRef.current.connect(splitterRef.current);
            splitterRef.current.connect(leftAnalyserRef.current, 0);
            splitterRef.current.connect(rightAnalyserRef.current, 1);

            // Reconnect to destination
            sourceNodeRef.current.connect(audioContext.destination);

            // Start visualization loop
            const updateVisualization = () => {
                if (!leftAnalyserRef.current || !rightAnalyserRef.current) return;

                const bufferLength = leftAnalyserRef.current.frequencyBinCount;
                const leftData = new Uint8Array(bufferLength);
                const rightData = new Uint8Array(bufferLength);

                leftAnalyserRef.current.getByteFrequencyData(leftData);
                rightAnalyserRef.current.getByteFrequencyData(rightData);

                // Calculate balance
                const leftAvg = leftData.reduce((a, b) => a + b, 0) / leftData.length;
                const rightAvg = rightData.reduce((a, b) => a + b, 0) / rightData.length;
                const total = leftAvg + rightAvg;
                const balance = total > 0 ? (rightAvg - leftAvg) / total : 0;

                setVisualizerData({
                    leftChannel: leftData,
                    rightChannel: rightData,
                    balance,
                });

                animationFrameRef.current = requestAnimationFrame(updateVisualization);
            };

            updateVisualization();
        } catch (error) {
            console.error('[Stereo Visualizer] Initialization failed:', error);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
            if (splitterRef.current) splitterRef.current.disconnect();
            if (leftAnalyserRef.current) leftAnalyserRef.current.disconnect();
            if (rightAnalyserRef.current) rightAnalyserRef.current.disconnect();
        };
    }, [audioElement]);

    return visualizerData;
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type VoiceCommand =
    | 'play' | 'pause' | 'next' | 'previous'
    | 'volume up' | 'volume down' | 'mute' | 'unmute'
    | 'shuffle' | 'repeat' | 'like' | 'unlike';

interface VoiceCommandHandlers {
    onPlay?: () => void;
    onPause?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    onVolumeUp?: () => void;
    onVolumeDown?: () => void;
    onShuffle?: () => void;
    onRepeat?: () => void;
    onLike?: () => void;
}

/**
 * Hook for voice command integration
 * 
 * Uses Web Speech API for voice control
 */
export function useVoiceCommands(handlers: VoiceCommandHandlers) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [lastCommand, setLastCommand] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        setIsSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            setLastCommand(transcript);
            handleCommand(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('[Voice] Recognition error:', event.error);
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleCommand = useCallback((transcript: string) => {
        console.log('[Voice] Command:', transcript);

        if (transcript.includes('play') && !transcript.includes('pause')) {
            handlers.onPlay?.();
        } else if (transcript.includes('pause') || transcript.includes('stop')) {
            handlers.onPause?.();
        } else if (transcript.includes('next') || transcript.includes('skip')) {
            handlers.onNext?.();
        } else if (transcript.includes('previous') || transcript.includes('back')) {
            handlers.onPrevious?.();
        } else if (transcript.includes('volume up') || transcript.includes('louder')) {
            handlers.onVolumeUp?.();
        } else if (transcript.includes('volume down') || transcript.includes('quieter')) {
            handlers.onVolumeDown?.();
        } else if (transcript.includes('shuffle')) {
            handlers.onShuffle?.();
        } else if (transcript.includes('repeat')) {
            handlers.onRepeat?.();
        } else if (transcript.includes('like') || transcript.includes('favorite')) {
            handlers.onLike?.();
        }
    }, [handlers]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && isSupported) {
            recognitionRef.current.start();
            setIsListening(true);
        }
    }, [isSupported]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, []);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return {
        isSupported,
        isListening,
        lastCommand,
        startListening,
        stopListening,
        toggleListening,
    };
}

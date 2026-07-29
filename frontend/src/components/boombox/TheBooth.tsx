'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TheBoothProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TheBooth = ({ isOpen, onClose }: TheBoothProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            toast.error("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const playPreview = () => {
        if (audioBlob) {
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            audio.play();
        }
    };

    const uploadIntro = async () => {
        if (!audioBlob) return;

        // TODO: Implement actual upload to Supabase 'voice-intros' bucket
        // const { data, error } = await supabase.storage.from('voice-intros').upload(...)

        toast.success("Intro uploaded! (Simulation)");
        setAudioBlob(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="text-center space-y-6 max-w-sm w-full">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold font-[family-name:var(--font-orbitron)] text-[var(--orange)] tracking-widest uppercase">
                        The Booth
                    </h2>
                    <p className="text-zinc-400 text-sm">
                        Record a 15s intro for your station. Make it official.
                    </p>
                </div>

                <div className={cn(
                    "w-32 h-32 rounded-full border-4 flex items-center justify-center mx-auto transition-all duration-300",
                    isRecording
                        ? "border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                        : "border-zinc-700 bg-zinc-900"
                )}>
                    <Mic className={cn(
                        "w-12 h-12 transition-colors",
                        isRecording ? "text-red-500 animate-pulse" : "text-zinc-500"
                    )} />
                </div>

                <div className="flex items-center justify-center gap-4">
                    {!isRecording && !audioBlob && (
                        <button
                            onClick={startRecording}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold uppercase tracking-wider flex items-center gap-2"
                        >
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                            Record
                        </button>
                    )}

                    {isRecording && (
                        <button
                            onClick={stopRecording}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-full font-bold uppercase tracking-wider flex items-center gap-2 border border-zinc-600"
                        >
                            <Square className="w-4 h-4 fill-current" />
                            Stop
                        </button>
                    )}

                    {!isRecording && audioBlob && (
                        <>
                            <button
                                onClick={playPreview}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full flex items-center gap-2 border border-zinc-600"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Preview
                            </button>
                            <button
                                onClick={uploadIntro}
                                className="bg-[var(--orange)] hover:bg-orange-600 text-black px-4 py-2 rounded-full font-bold uppercase tracking-wider flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                Upload
                            </button>
                        </>
                    )}
                </div>

                {isRecording && (
                    <div className="text-red-500 font-mono text-sm animate-pulse">
                        ● RELEASE TO STOP
                    </div>
                )}
            </div>
        </div>
    );
};

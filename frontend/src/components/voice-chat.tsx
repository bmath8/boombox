'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX,
    Users, Settings, Headphones, Radio, Signal
} from 'lucide-react';
import { useWebSocket } from '@/lib/websocket';
import { handleError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { VoiceSignalMessage, VoiceJoinMessage, VoiceLeaveMessage, VoiceSpeakingMessage } from '@/types/websocket';

interface VoiceChatParticipant {
    id: string;
    name: string;
    avatar: string | undefined;
    isSpeaking: boolean;
    isMuted: boolean;
    isDeafened: boolean;
}

interface VoiceChatProps {
    stationId: string;
    isBroadcaster?: boolean;
}

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

// Helper component for remote audio
function RemoteAudio({ stream }: { stream: MediaStream }) {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current && stream) {
            audioRef.current.srcObject = stream;
            audioRef.current.play().catch(e => console.error('Audio play failed:', e));
        }
    }, [stream]);

    return <audio ref={audioRef} autoPlay playsInline />;
}

export function VoiceChat({ stationId, isBroadcaster = false }: VoiceChatProps) {
    const { sendMessage, lastMessage } = useWebSocket();
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isDeafened, setIsDeafened] = useState(false);
    const [isPushToTalk, setIsPushToTalk] = useState(true);
    const [isTalking, setIsTalking] = useState(false);
    const [participants, setParticipants] = useState<VoiceChatParticipant[]>([]);
    const [volume, setVolume] = useState(80);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

    const localStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const currentUserRef = useRef<{ id: string; name: string; avatar?: string } | null>(null);
    const speakingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize WebRTC Peer Connection
    const createPeerConnection = useCallback((targetUserId: string, initiator: boolean) => {
        if (peersRef.current.has(targetUserId)) {
            console.warn(`Peer connection already exists for ${targetUserId}`);
            return peersRef.current.get(targetUserId)!;
        }

        console.log(`Creating peer connection to ${targetUserId} (initiator: ${initiator})`);
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && currentUserRef.current) {
                sendMessage({
                    type: 'voice:signal',
                    stationId,
                    targetUserId,
                    senderId: currentUserRef.current.id,
                    signal: {
                        type: 'ice-candidate',
                        candidate: {
                            candidate: event.candidate.candidate,
                            sdpMid: event.candidate.sdpMid,
                            sdpMLineIndex: event.candidate.sdpMLineIndex
                        }
                    },
                    timestamp: Date.now()
                });
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log(`Received remote track from ${targetUserId}`);
            const [remoteStream] = event.streams;
            if (remoteStream) {
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.set(targetUserId, remoteStream);
                    return newMap;
                });
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${targetUserId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                cleanupPeer(targetUserId);
            }
        };

        peersRef.current.set(targetUserId, pc);

        if (initiator) {
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    if (currentUserRef.current) {
                        sendMessage({
                            type: 'voice:signal',
                            stationId,
                            targetUserId,
                            senderId: currentUserRef.current.id,
                            signal: {
                                type: 'offer',
                                sdp: pc.localDescription?.sdp
                            },
                            timestamp: Date.now()
                        });
                    }
                })
                .catch(e => console.error('Offer creation failed:', e));
        }

        return pc;
    }, [stationId, sendMessage]);

    const handleSignal = useCallback(async (msg: VoiceSignalMessage) => {
        const { senderId, signal } = msg;
        if (!isConnected || !currentUserRef.current || !senderId) return;

        // If we receive a signal from someone not in our participants list, we should add them purely for UI
        // But optimally we wait for voice:join. However, if we missed voice:join (joined after them), 
        // receiving an offer is a sign they are there. But we don't have their name/avatar.
        // For now, simpler to rely on just processing the connection. 

        let pc = peersRef.current.get(senderId);

        if (!pc) {
            if (signal.type === 'offer') {
                pc = createPeerConnection(senderId, false);
            } else {
                console.warn('Received signal for unknown peer:', senderId);
                return;
            }
        }

        try {
            if (signal.type === 'offer' && signal.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendMessage({
                    type: 'voice:signal',
                    stationId,
                    targetUserId: senderId,
                    senderId: currentUserRef.current.id,
                    signal: {
                        type: 'answer',
                        sdp: pc.localDescription?.sdp
                    },
                    timestamp: Date.now()
                });
            } else if (signal.type === 'answer' && signal.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
            } else if (signal.type === 'ice-candidate' && signal.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
        } catch (e) {
            console.error('Signaling error:', e);
        }
    }, [isConnected, stationId, sendMessage, createPeerConnection]);

    const cleanupPeer = useCallback((userId: string) => {
        const pc = peersRef.current.get(userId);
        if (pc) {
            pc.close();
            peersRef.current.delete(userId);
        }
        setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
        });
        setParticipants(prev => prev.filter(p => p.id !== userId));
    }, []);

    // Handle WebSocket messages
    useEffect(() => {
        if (!lastMessage || !isConnected) return;

        // Ensure we only process messages for this station
        if ('stationId' in lastMessage && lastMessage.stationId !== stationId) return;

        switch (lastMessage.type) {
            case 'voice:join': {
                const msg = lastMessage as VoiceJoinMessage;
                // Add to participants if not exists
                setParticipants(prev => {
                    if (prev.some(p => p.id === msg.userId)) return prev;
                    return [...prev, {
                        id: msg.userId,
                        name: msg.userName,
                        avatar: msg.avatar,
                        isSpeaking: false,
                        isMuted: true, // Assume muted initially until otherwise
                        isDeafened: false
                    }];
                });

                // If I am already connected, I should initiate connection to the new joiner
                if (currentUserRef.current && msg.userId !== currentUserRef.current.id) {
                    createPeerConnection(msg.userId, true);
                }
                break;
            }
            case 'voice:leave': {
                const msg = lastMessage as VoiceLeaveMessage;
                cleanupPeer(msg.userId);
                break;
            }
            case 'voice:signal': {
                handleSignal(lastMessage as VoiceSignalMessage);
                break;
            }
            case 'voice:speaking': {
                const msg = lastMessage as VoiceSpeakingMessage;
                setParticipants(prev => prev.map(p =>
                    p.id === msg.userId ? { ...p, isSpeaking: msg.speaking } : p
                ));
                break;
            }
        }
    }, [lastMessage, stationId, isConnected, createPeerConnection, handleSignal, cleanupPeer]);

    const joinVoiceChat = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Please sign in to join voice chat');
                return;
            }

            // Save current user info
            currentUserRef.current = {
                id: user.id,
                name: user.user_metadata?.['display_name'] || 'User',
                avatar: user.user_metadata?.['avatar_url']
            };

            // Get media stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            localStreamRef.current = stream;

            // Setup local audio analysis
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            // Start speaking detection
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            let lastSpeakingState = false;

            speakingIntervalRef.current = setInterval(() => {
                if (!analyserRef.current || isMuted) return;

                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
                const isNowSpeaking = average > 10; // Threshold

                if (isNowSpeaking !== lastSpeakingState) {
                    lastSpeakingState = isNowSpeaking;
                    setIsTalking(isNowSpeaking);
                    sendMessage({
                        type: 'voice:speaking',
                        stationId,
                        userId: user.id,
                        speaking: isNowSpeaking,
                        timestamp: Date.now()
                    });
                }
            }, 100);

            // Add self to participants list
            setParticipants([{
                id: user.id,
                name: currentUserRef.current.name,
                avatar: currentUserRef.current.avatar,
                isSpeaking: false,
                isMuted: true, // Started muted
                isDeafened: false
            }]);

            setIsConnected(true);
            setIsMuted(true);

            // disable tracks initially if muted
            stream.getAudioTracks().forEach(track => track.enabled = false);

            sendMessage({
                type: 'voice:join',
                stationId,
                userId: user.id,
                userName: currentUserRef.current.name,
                avatar: currentUserRef.current.avatar,
                timestamp: Date.now()
            });

            toast.success('Joined voice chat');

        } catch (error) {
            console.error('Join error:', error);
            if ((error as Error).name === 'NotAllowedError') {
                toast.error('Microphone access denied');
            } else {
                toast.error('Failed to join voice chat');
            }
        }
    };

    const leaveVoiceChat = useCallback(async () => {
        // Stop loops
        if (speakingIntervalRef.current) {
            clearInterval(speakingIntervalRef.current);
        }

        // Close peer connections
        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        setRemoteStreams(new Map());

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Notify server
        if (currentUserRef.current) {
            sendMessage({
                type: 'voice:leave',
                stationId,
                userId: currentUserRef.current.id,
                timestamp: Date.now()
            });
        }

        setIsConnected(false);
        setParticipants([]);
        currentUserRef.current = null;
        toast.success('Left voice chat');
    }, [stationId, sendMessage]);

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                const newMuted = !isMuted;
                audioTrack.enabled = !newMuted; // enabled = true means NOT muted
                setIsMuted(newMuted);

                // Force speaking to false if muted
                if (newMuted) {
                    setIsTalking(false);
                    if (currentUserRef.current) {
                        sendMessage({
                            type: 'voice:speaking',
                            stationId,
                            userId: currentUserRef.current.id,
                            speaking: false,
                            timestamp: Date.now()
                        });
                    }
                }
            }
        }
    };

    const toggleDeafen = () => {
        setIsDeafened(!isDeafened);
        // Mute all remote audio elements
        // This is handled by rendering, but we can also set volume to 0
    };

    const togglePushToTalk = () => {
        setIsPushToTalk(!isPushToTalk);
    };

    // Push to talk handlers
    const handlePTTStart = () => {
        if (!isPushToTalk || !isConnected) return;
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = true;
                setIsMuted(false);
            }
        }
    };

    const handlePTTEnd = () => {
        if (!isPushToTalk || !isConnected) return;
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = false;
                setIsMuted(true);
            }
        }
    };

    // Keyboard shortcut for PTT
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.code === 'KeyV' || e.code === 'Space') && isPushToTalk && isConnected && !e.repeat) {
                // Check if not typing in input
                if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
                handlePTTStart();
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if ((e.code === 'KeyV' || e.code === 'Space') && isPushToTalk && isConnected) {
                handlePTTEnd();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isConnected, isPushToTalk]);

    // Handle render of audio elements
    // We mute them if we are deafened
    useEffect(() => {
        if (isDeafened) {
            // Mute all remote audio is handled via volume usually, but here we can just detach?
            // Or simpler: rendered RemoteAudio components check isDeafened prop? 
            // I'll update RemoteAudio to take muted prop.
        }
    }, [isDeafened]);

    return (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden flex flex-col h-full">
            {/* Hidden Audio Elements */}
            {Array.from(remoteStreams.entries()).map(([id, stream]) => (
                !isDeafened && <RemoteAudio key={id} stream={stream} />
            ))}

            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Radio className="w-5 h-5 text-green-400" />
                        Voice
                        {isConnected && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                On Air
                            </span>
                        )}
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={togglePushToTalk}
                            className={`p-1.5 rounded-lg transition-colors ${isPushToTalk ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}
                            title="Toggle Push to Talk"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">
                            <Users className="w-3 h-3" />
                            {participants.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Participants Grid */}
            <div className="flex-1 p-4 overflow-y-auto min-h-[200px]">
                {!isConnected ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <Mic className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <h4 className="font-medium text-white mb-1">Join the conversation</h4>
                            <p className="text-xs text-muted-foreground">High quality voice chat</p>
                        </div>
                        <button
                            onClick={joinVoiceChat}
                            className="w-full max-w-[200px] py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            <Phone className="w-4 h-4" />
                            Join Voice
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <AnimatePresence>
                            {participants.map((participant) => (
                                <motion.div
                                    key={participant.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`relative p-3 rounded-xl border transition-all ${participant.isSpeaking
                                        ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${participant.isSpeaking ? 'border-green-500' : 'border-transparent'
                                                }`}>
                                                {participant.avatar ? (
                                                    <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white">
                                                        {participant.name[0]}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Status Badge */}
                                            <div className="absolute -bottom-1 -right-1 bg-black/80 rounded-full p-0.5">
                                                {participant.isMuted ? (
                                                    <MicOff className="w-3 h-3 text-red-500" />
                                                ) : participant.isSpeaking ? (
                                                    <Signal className="w-3 h-3 text-green-500" />
                                                ) : (
                                                    <Mic className="w-3 h-3 text-gray-400" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-white truncate">
                                                {participant.name}
                                                {participant.id === currentUserRef.current?.id && ' (You)'}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {participant.isSpeaking ? 'Speaking...' : participant.isMuted ? 'Muted' : 'Online'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            {isConnected && (
                <div className="p-4 bg-black/20 backdrop-blur border-t border-white/10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleMute}
                                className={`p-3 rounded-xl transition-all ${isMuted
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={toggleDeafen}
                                className={`p-3 rounded-xl transition-all ${isDeafened
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {isDeafened ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* PTT Button for Touch/Click */}
                        {isPushToTalk && (
                            <button
                                onMouseDown={handlePTTStart}
                                onMouseUp={handlePTTEnd}
                                onMouseLeave={handlePTTEnd}
                                onTouchStart={(e) => { e.preventDefault(); handlePTTStart(); }}
                                onTouchEnd={(e) => { e.preventDefault(); handlePTTEnd(); }}
                                className={`flex-1 h-12 rounded-xl font-bold uppercase tracking-wide transition-all ${isTalking
                                    ? 'bg-green-500 text-white scale-95 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]'
                                    : 'bg-white/10 text-white hover:bg-white/15'
                                    }`}
                            >
                                {isTalking ? 'Broadcasting' : 'Hold to Talk'}
                            </button>
                        )}

                        <button
                            onClick={leaveVoiceChat}
                            className="p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-xl transition-colors"
                        >
                            <PhoneOff className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

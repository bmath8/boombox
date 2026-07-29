/**
 * WebSocket Message Types
 * Type-safe definitions for all WebSocket messages
 * Replaces `any` types with discriminated unions
 */

// ============================================================================
// Base Message Types
// ============================================================================

interface BaseMessage {
    timestamp: number;
}

// ============================================================================
// Client -> Server Messages
// ============================================================================

export type ClientMessage =
    | RadioJoinMessage
    | RadioLeaveMessage
    | RadioTrackChangeMessage
    | RadioPositionUpdateMessage
    | RadioChatMessage
    | RadioSongRequestMessage
    | RadioReactionMessage
    | FeedUpdateMessage
    | PlaylistUpdateMessage
    | VoteUpdateMessage
    | PresenceUpdateMessage
    | ChatMessage
    | ChatReactionMessage
    | ChatPinMessage
    | ChatDeleteMessage
    | VoiceJoinMessage
    | VoiceLeaveMessage
    | VoiceSpeakingMessage
    | VoiceSignalMessage
    | PingMessage;

export interface RadioJoinMessage extends BaseMessage {
    type: 'radio:join';
    stationId: string;
}

export interface RadioLeaveMessage extends BaseMessage {
    type: 'radio:leave';
    stationId: string;
}

export interface RadioTrackChangeMessage extends BaseMessage {
    type: 'radio:track-change';
    stationId: string;
    track: {
        id: string;
        name: string;
        artists: string;
        albumArt?: string;
        durationMs: number;
    };
}

export interface RadioPositionUpdateMessage extends BaseMessage {
    type: 'radio:position-update';
    stationId: string;
    positionMs: number;
}

export interface RadioChatMessage extends BaseMessage {
    type: 'radio:chat';
    stationId: string;
    message: string;
}

export interface RadioSongRequestMessage extends BaseMessage {
    type: 'radio:song-request';
    stationId: string;
    track: {
        id: string;
        name: string;
        artist: string;
        image?: string | undefined;
        uri: string;
    };
}

export interface RadioReactionMessage extends BaseMessage {
    type: 'radio:reaction';
    stationId: string;
    emoji: string;
}

export interface FeedUpdateMessage extends BaseMessage {
    type: 'feed:update';
    activity: {
        trackId: string;
        trackName: string;
        artists: string;
        albumArt?: string;
    };
}

export interface PingMessage extends BaseMessage {
    type: 'ping';
}

// ============================================================================
// Server -> Client Messages
// ============================================================================

export type ServerMessage =
    | ConnectedMessage
    | RadioJoinedMessage
    | RadioListenerJoinedMessage
    | RadioListenerLeftMessage
    | RadioTrackChangedMessage
    | RadioPositionUpdatedMessage
    | RadioChatReceivedMessage
    | RadioSongRequestReceivedMessage
    | RadioReactionReceivedMessage
    | FeedNewActivityMessage
    | PlaylistUpdateMessage
    | VoteUpdateMessage
    | PresenceUpdateMessage
    | PongMessage
    | ChatMessage
    | ChatReactionMessage
    | ChatPinMessage
    | ChatDeleteMessage
    | VoiceJoinMessage
    | VoiceLeaveMessage
    | VoiceSpeakingMessage
    | VoiceSignalMessage
    | ErrorMessage;

export interface ConnectedMessage extends BaseMessage {
    type: 'connected';
    userId: string;
}

export interface RadioJoinedMessage extends BaseMessage {
    type: 'radio:joined';
    stationId: string;
}

export interface RadioListenerJoinedMessage extends BaseMessage {
    type: 'radio:listener-joined';
    stationId: string;
    userId: string;
    listenerCount: number;
}

export interface RadioListenerLeftMessage extends BaseMessage {
    type: 'radio:listener-left';
    stationId: string;
    userId: string;
    listenerCount: number;
}

export interface RadioTrackChangedMessage extends BaseMessage {
    type: 'radio:track-change';
    stationId: string;
    track: {
        id: string;
        name: string;
        artists: string;
        albumArt?: string;
        durationMs: number;
    };
}

export interface RadioPositionUpdatedMessage extends BaseMessage {
    type: 'radio:position-update';
    stationId: string;
    positionMs: number;
}

export interface RadioChatReceivedMessage extends BaseMessage {
    type: 'radio:chat';
    stationId: string;
    userId: string;
    message: string;
}

export interface RadioSongRequestReceivedMessage extends BaseMessage {
    type: 'radio:song-request';
    stationId: string;
    requesterId: string;
    track: {
        id: string;
        name: string;
        artist: string;
        image?: string | undefined;
        uri: string;
    };
}

export interface RadioReactionReceivedMessage extends BaseMessage {
    type: 'radio:reaction';
    stationId: string;
    userId: string;
    emoji: string;
}

export interface FeedNewActivityMessage extends BaseMessage {
    type: 'feed:new-activity';
    userId: string;
    activity: {
        trackId: string;
        trackName: string;
        artists: string;
        albumArt?: string;
    };
}

export interface PlaylistUpdateMessage extends BaseMessage {
    type: 'playlist:update';
    stationId: string;
    queueId?: string;
    action: 'add' | 'remove' | 'move';
    track?: any;
    userId?: string;
}

export interface VoteUpdateMessage extends BaseMessage {
    type: 'vote:update';
    stationId: string;
    trackId: string;
    voteType: 'up' | 'down';
    userId?: string;
}

export interface PresenceUpdateMessage extends BaseMessage {
    type: 'presence:update';
    stationId: string;
    userId?: string;
    status?: 'online' | 'offline' | 'idle';
    isTyping?: boolean;
}

export interface PongMessage extends BaseMessage {
    type: 'pong';
}

export interface ErrorMessage extends BaseMessage {
    type: 'error';
    message: string;
}

export interface ChatMessage extends BaseMessage {
    type: 'chat:message';
    stationId: string;
    message: unknown;
}

export interface ChatReactionMessage extends BaseMessage {
    type: 'chat:reaction';
    stationId: string;
    messageId: string;
    emoji: string;
    userId: string;
}

export interface ChatPinMessage extends BaseMessage {
    type: 'chat:pin';
    stationId: string;
    messageId: string;
}

export interface ChatDeleteMessage extends BaseMessage {
    type: 'chat:delete';
    stationId: string;
    messageId: string;
}

export interface VoiceJoinMessage extends BaseMessage {
    type: 'voice:join';
    stationId: string;
    userId: string;
    userName: string;
    avatar?: string | undefined;
}

export interface VoiceLeaveMessage extends BaseMessage {
    type: 'voice:leave';
    stationId: string;
    userId: string;
}

export interface VoiceSpeakingMessage extends BaseMessage {
    type: 'voice:speaking';
    stationId: string;
    userId: string;
    speaking: boolean;
}

export interface VoiceSignalMessage extends BaseMessage {
    type: 'voice:signal';
    stationId: string;
    targetUserId: string;
    senderId?: string;
    signal: {
        type: 'offer' | 'answer' | 'ice-candidate';
        sdp?: string | undefined;
        candidate?: {
            candidate: string;
            sdpMid: string | null;
            sdpMLineIndex: number | null;
            usernameFragment?: string | null;
        } | undefined;
    };
}

// ============================================================================
// Type Guards
// ============================================================================

export function isServerMessage(message: unknown): message is ServerMessage {
    return (
        typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        'timestamp' in message
    );
}

export function isRadioMessage(message: ServerMessage): message is
    | RadioJoinedMessage
    | RadioListenerJoinedMessage
    | RadioListenerLeftMessage
    | RadioTrackChangedMessage
    | RadioPositionUpdatedMessage
    | RadioChatReceivedMessage
    | RadioReactionReceivedMessage {
    return message.type.startsWith('radio:');
}

export function isFeedMessage(message: ServerMessage): message is FeedNewActivityMessage {
    return message.type.startsWith('feed:');
}

export function isErrorMessage(message: ServerMessage): message is ErrorMessage {
    return message.type === 'error';
}

/**
 * Command Pattern for Undo/Redo
 *
 * Implements the Command pattern to support undo/redo functionality
 */

export interface Command {
    /**
     * Unique identifier for this command
     */
    id: string;

    /**
     * Human-readable description of the action
     */
    description: string;

    /**
     * Execute the command
     */
    execute(): Promise<void> | void;

    /**
     * Undo the command
     */
    undo(): Promise<void> | void;

    /**
     * Redo the command (default implementation re-executes)
     */
    redo?(): Promise<void> | void;

    /**
     * Timestamp when the command was executed
     */
    timestamp: number;
}

/**
 * Track Deletion Command
 */
export class DeleteTrackCommand implements Command {
    id: string;
    description: string;
    timestamp: number;

    constructor(
        private trackId: string,
        private playlistId: string,
        private trackData: any,
        private onDelete: (trackId: string, playlistId: string) => Promise<void>,
        private onRestore: (trackData: any, playlistId: string) => Promise<void>
    ) {
        this.id = `delete-track-${Date.now()}`;
        this.description = `Removed track from playlist`;
        this.timestamp = Date.now();
    }

    async execute() {
        await this.onDelete(this.trackId, this.playlistId);
    }

    async undo() {
        await this.onRestore(this.trackData, this.playlistId);
    }
}

/**
 * Profile Update Command
 */
export class UpdateProfileCommand implements Command {
    id: string;
    description: string;
    timestamp: number;

    constructor(
        private previousData: any,
        private newData: any,
        private onUpdate: (data: any) => Promise<void>
    ) {
        this.id = `update-profile-${Date.now()}`;
        this.description = 'Updated profile';
        this.timestamp = Date.now();
    }

    async execute() {
        await this.onUpdate(this.newData);
    }

    async undo() {
        await this.onUpdate(this.previousData);
    }
}

/**
 * Playlist Reorder Command
 */
export class ReorderPlaylistCommand implements Command {
    id: string;
    description: string;
    timestamp: number;

    constructor(
        private playlistId: string,
        private previousOrder: string[],
        private newOrder: string[],
        private onReorder: (playlistId: string, order: string[]) => Promise<void>
    ) {
        this.id = `reorder-playlist-${Date.now()}`;
        this.description = 'Reordered playlist tracks';
        this.timestamp = Date.now();
    }

    async execute() {
        await this.onReorder(this.playlistId, this.newOrder);
    }

    async undo() {
        await this.onReorder(this.playlistId, this.previousOrder);
    }
}

/**
 * Follow/Unfollow Command
 */
export class FollowUserCommand implements Command {
    id: string;
    description: string;
    timestamp: number;

    constructor(
        private userId: string,
        private userName: string,
        private isFollowing: boolean,
        private onFollow: (userId: string) => Promise<void>,
        private onUnfollow: (userId: string) => Promise<void>
    ) {
        this.id = `follow-user-${Date.now()}`;
        this.description = isFollowing ? `Followed ${userName}` : `Unfollowed ${userName}`;
        this.timestamp = Date.now();
    }

    async execute() {
        if (this.isFollowing) {
            await this.onFollow(this.userId);
        } else {
            await this.onUnfollow(this.userId);
        }
    }

    async undo() {
        if (this.isFollowing) {
            await this.onUnfollow(this.userId);
        } else {
            await this.onFollow(this.userId);
        }
    }
}

/**
 * Generic Command
 */
export class GenericCommand implements Command {
    id: string;
    description: string;
    timestamp: number;

    constructor(
        description: string,
        private executeAction: () => Promise<void> | void,
        private undoAction: () => Promise<void> | void
    ) {
        this.id = `generic-${Date.now()}`;
        this.description = description;
        this.timestamp = Date.now();
    }

    async execute() {
        await this.executeAction();
    }

    async undo() {
        await this.undoAction();
    }
}

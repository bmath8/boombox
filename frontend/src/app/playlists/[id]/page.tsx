'use client';

import { CollaborativePlaylistView } from '@/components/collaborative-playlist-view';
import { useParams } from 'next/navigation';

export default function PlaylistPage() {
    const { id } = useParams();

    if (!id || typeof id !== 'string') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>Invalid playlist ID</p>
            </div>
        );
    }

    return <CollaborativePlaylistView playlistId={id} />;
}

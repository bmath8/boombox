"use client";

import { BoomboxFrame } from "@/components/boombox/BoomboxFrame";

export default function TestBoomboxPage() {
    return (
        <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black text-white">
            <BoomboxFrame
                onLogin={async () => { console.log("Login mocked"); }}
                onSpotifyLogin={() => { console.log("Spotify mocked"); }}
                isLoading={false}
            />
        </main>
    );
}

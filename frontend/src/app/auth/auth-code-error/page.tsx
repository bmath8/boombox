'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

function AuthErrorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read params directly during render (safe because of Suspense)
    const errorParam = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDesc = searchParams.get('error_description');

    const error = errorCode || errorParam || 'Unknown error';
    const errorDescription = errorDesc || 'An error occurred during authentication';

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="glass-dark rounded-2xl p-8 border border-red-500/20">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
                        <p className="text-muted-foreground mb-6">
                            {errorDescription}
                        </p>

                        {error && (
                            <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
                                <p className="text-sm text-red-400 font-mono">
                                    Error Code: {error}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => router.push('/login')}
                                className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Home
                            </button>
                        </div>

                        <div className="mt-6 text-sm text-muted-foreground">
                            <p>Common solutions:</p>
                            <ul className="mt-2 space-y-1 text-left">
                                <li>• Verify your Spotify email address</li>
                                <li>• Check your internet connection</li>
                                <li>• Try clearing your browser cache</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AuthCodeErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        }>
            <AuthErrorContent />
        </Suspense>
    );
}

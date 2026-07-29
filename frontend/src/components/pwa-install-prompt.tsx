'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIOSHaptics } from '@/hooks/use-ios-haptics';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Session tracking and analytics
 */
interface SessionData {
    sessionCount: number;
    totalTimeSpent: number; // milliseconds
    lastVisit: number; // timestamp
    firstVisit: number; // timestamp
}

interface InstallPromptAnalytics {
    promptShown: number;
    promptAccepted: number;
    promptDismissed: number;
    variant: 'A' | 'B'; // A/B testing variant
}

const STORAGE_KEYS = {
    SESSION_DATA: 'pwa_session_data',
    INSTALL_DISMISSED: 'pwa-install-dismissed',
    PROMPT_COUNT: 'pwa-install-prompt-count',
    ANALYTICS: 'pwa_install_analytics',
    VARIANT: 'pwa_ab_variant',
};

const PROMPT_RULES = {
    MIN_SESSIONS: 2,
    MIN_TIME_SPENT: 5 * 60 * 1000, // 5 minutes
    COOLDOWN_PERIOD: 7 * 24 * 60 * 60 * 1000, // 7 days
    MAX_DISMISSALS: 3,
    SHOW_DELAY: 10000, // 10 seconds after conditions met
};

/**
 * Detect if running on iOS
 */
function isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Detect if running on Android
 */
function isAndroid(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android/.test(navigator.userAgent);
}

/**
 * Detect if running as standalone PWA
 */
function isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
}

/**
 * Get or initialize session data
 */
function getSessionData(): SessionData {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('[PWA] Failed to parse session data:', e);
        }
    }

    const now = Date.now();
    return {
        sessionCount: 0,
        totalTimeSpent: 0,
        lastVisit: now,
        firstVisit: now,
    };
}

/**
 * Update session data
 */
function updateSessionData(): SessionData {
    const data = getSessionData();
    const now = Date.now();

    // Count as new session if last visit was > 30 minutes ago
    const isNewSession = (now - data.lastVisit) > (30 * 60 * 1000);

    const updated: SessionData = {
        sessionCount: isNewSession ? data.sessionCount + 1 : data.sessionCount,
        totalTimeSpent: data.totalTimeSpent,
        lastVisit: now,
        firstVisit: data.firstVisit,
    };

    localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(updated));
    return updated;
}

/**
 * Track time spent on site
 */
function trackTimeSpent(startTime: number): void {
    const sessionData = getSessionData();
    const timeSpent = Date.now() - startTime;

    const updated: SessionData = {
        ...sessionData,
        totalTimeSpent: sessionData.totalTimeSpent + timeSpent,
    };

    localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(updated));
}

/**
 * Get or assign A/B testing variant
 */
function getABVariant(): 'A' | 'B' {
    const stored = localStorage.getItem(STORAGE_KEYS.VARIANT);
    if (stored === 'A' || stored === 'B') return stored;

    // Randomly assign variant
    const variant: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
    localStorage.setItem(STORAGE_KEYS.VARIANT, variant);
    return variant;
}

/**
 * Track analytics event
 */
function trackInstallEvent(event: 'shown' | 'accepted' | 'dismissed'): void {
    const stored = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
    let analytics: InstallPromptAnalytics;

    if (stored) {
        try {
            analytics = JSON.parse(stored);
        } catch (e) {
            analytics = {
                promptShown: 0,
                promptAccepted: 0,
                promptDismissed: 0,
                variant: getABVariant(),
            };
        }
    } else {
        analytics = {
            promptShown: 0,
            promptAccepted: 0,
            promptDismissed: 0,
            variant: getABVariant(),
        };
    }

    if (event === 'shown') analytics.promptShown++;
    if (event === 'accepted') analytics.promptAccepted++;
    if (event === 'dismissed') analytics.promptDismissed++;

    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));

    // Log conversion rate for debugging
    if (analytics.promptShown > 0) {
        const conversionRate = (analytics.promptAccepted / analytics.promptShown) * 100;
        console.log(`[PWA Analytics] Variant ${analytics.variant}: ${conversionRate.toFixed(1)}% conversion (${analytics.promptAccepted}/${analytics.promptShown})`);
    }
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);
    const [variant, setVariant] = useState<'A' | 'B'>('A');
    const { triggerHaptic } = useIOSHaptics();
    const isiOS = isIOS();
    const isAndroidDevice = isAndroid();

    useEffect(() => {
        // Initialize session tracking
        const sessionStartTime = Date.now();
        const sessionData = updateSessionData();
        const abVariant = getABVariant();
        setVariant(abVariant);

        // Track time spent on unload
        const handleUnload = () => {
            trackTimeSpent(sessionStartTime);
        };

        window.addEventListener('beforeunload', handleUnload);
        window.addEventListener('pagehide', handleUnload);

        // Check if already installed
        if (isStandalone()) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed recently
        const dismissedAt = localStorage.getItem(STORAGE_KEYS.INSTALL_DISMISSED);
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            if (Date.now() - dismissedTime < PROMPT_RULES.COOLDOWN_PERIOD) {
                return;
            }
        }

        // Check dismiss count
        const dismissCount = parseInt(localStorage.getItem(STORAGE_KEYS.PROMPT_COUNT) || '0', 10);
        if (dismissCount >= PROMPT_RULES.MAX_DISMISSALS) {
            return;
        }

        // Smart timing: Check if user meets engagement criteria
        const shouldShow =
            sessionData.sessionCount >= PROMPT_RULES.MIN_SESSIONS &&
            sessionData.totalTimeSpent >= PROMPT_RULES.MIN_TIME_SPENT;

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            if (shouldShow) {
                setTimeout(() => {
                    setShowPrompt(true);
                    trackInstallEvent('shown');
                }, PROMPT_RULES.SHOW_DELAY);
            }
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
            trackInstallEvent('accepted');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        // For iOS, show prompt if criteria met
        if (isiOS && shouldShow) {
            setTimeout(() => {
                setShowPrompt(true);
                trackInstallEvent('shown');
            }, PROMPT_RULES.SHOW_DELAY);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('beforeunload', handleUnload);
            window.removeEventListener('pagehide', handleUnload);
        };
    }, [isiOS]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        try {
            triggerHaptic('medium');
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                trackInstallEvent('accepted');
                console.log('[PWA] Installation accepted');
            } else {
                trackInstallEvent('dismissed');
            }

            setDeferredPrompt(null);
            setShowPrompt(false);
        } catch (error) {
            console.error('[PWA] Install error:', error);
        }
    };

    const handleDismiss = () => {
        triggerHaptic('light');
        setShowPrompt(false);
        setShowIOSInstructions(false);
        trackInstallEvent('dismissed');

        localStorage.setItem(STORAGE_KEYS.INSTALL_DISMISSED, Date.now().toString());

        const count = parseInt(localStorage.getItem(STORAGE_KEYS.PROMPT_COUNT) || '0', 10);
        localStorage.setItem(STORAGE_KEYS.PROMPT_COUNT, (count + 1).toString());
    };

    const handleIOSInstall = () => {
        triggerHaptic('medium');
        setShowIOSInstructions(true);
    };

    if (isInstalled || (!showPrompt && !showIOSInstructions)) return null;

    // Platform-specific messaging
    const getMessage = () => {
        if (variant === 'A') {
            // Variant A: Feature-focused
            if (isAndroidDevice) {
                return {
                    title: 'Install BOOMBOX',
                    description: 'Get offline access, faster performance, and quick launch from your home screen.',
                };
            }
            if (isiOS) {
                return {
                    title: 'Add to Home Screen',
                    description: 'Access BOOMBOX instantly with offline support and a native app experience.',
                };
            }
            return {
                title: 'Install BOOMBOX',
                description: 'Get the full experience with offline support and quick access.',
            };
        } else {
            // Variant B: Benefit-focused
            if (isAndroidDevice) {
                return {
                    title: 'Never Miss a Beat',
                    description: 'Install BOOMBOX for lightning-fast access and offline listening.',
                };
            }
            if (isiOS) {
                return {
                    title: 'Upgrade Your Experience',
                    description: 'Add BOOMBOX to your home screen for instant access anytime, anywhere.',
                };
            }
            return {
                title: 'Get the Best Experience',
                description: 'Install now for faster loading and offline access.',
            };
        }
    };

    const message = getMessage();

    // iOS-specific install instructions
    if (isiOS && showIOSInstructions) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
                >
                    <div className="bg-gradient-to-r from-primary/90 to-purple-600/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/10">
                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 p-1 text-white/60 hover:text-white transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/10 rounded-xl">
                                    <Smartphone className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base">Install BOOMBOX</h3>
                                    <p className="text-white/70 text-xs">Add to Home Screen</p>
                                </div>
                            </div>

                            <div className="bg-white/10 rounded-xl p-3 space-y-2">
                                <p className="text-white/90 text-sm font-medium">How to install:</p>
                                <ol className="text-white/80 text-xs space-y-1 list-decimal list-inside">
                                    <li>Tap the <Share className="inline w-3 h-3 mx-1" /> Share button below</li>
                                    <li>Scroll down and tap "Add to Home Screen"</li>
                                    <li>Tap "Add" to confirm</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
            >
                <div className="bg-gradient-to-r from-primary/90 to-purple-600/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/10">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-1 text-white/60 hover:text-white transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-xl">
                            {variant === 'B' ? (
                                <TrendingUp className="w-8 h-8 text-white" />
                            ) : (
                                <Smartphone className="w-8 h-8 text-white" />
                            )}
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-white text-lg mb-1">
                                {message.title}
                            </h3>
                            <p className="text-white/80 text-sm mb-3">
                                {message.description}
                            </p>

                            <div className="flex gap-2">
                                {deferredPrompt ? (
                                    <button
                                        onClick={handleInstall}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Install
                                    </button>
                                ) : isiOS ? (
                                    <button
                                        onClick={handleIOSInstall}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        How to Install
                                    </button>
                                ) : null}
                                <button
                                    onClick={handleDismiss}
                                    className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                                >
                                    Not now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

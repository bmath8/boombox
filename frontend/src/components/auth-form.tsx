'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Music2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

type MessageType = 'error' | 'success' | 'info';

interface Message {
    type: MessageType;
    title: string;
    description: string;
    details?: string | undefined;
}

export function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);

    const showMessage = (type: MessageType, title: string, description: string, details?: string) => {
        logger.info(`Auth ${type}`, { title, description, details });
        setMessage({ type, title, description, details: details || undefined });

        // Auto-dismiss success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        logger.info('Starting authentication', { isLogin, email });

        try {
            if (isLogin) {
                logger.info('Attempting login');
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    logger.error('Login error', error);
                    throw error;
                }

                logger.info('Login successful', { email: data.user?.email });
                showMessage('success', 'Login Successful!', `Welcome back, ${data.user?.email}`);

                // Force a full page reload to ensure cookies are set
                setTimeout(() => {
                    window.location.replace('/');
                }, 1500);
            } else {
                logger.info('Attempting signup');
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback`,
                    },
                });

                if (error) {
                    logger.error('Signup error', error);
                    throw error;
                }

                logger.info('Signup response', data);

                if (data.user) {
                    if (data.user.identities && data.user.identities.length === 0) {
                        showMessage('error', 'Email Already Registered',
                            'This email is already registered. Please try logging in instead.',
                            'If you forgot your password, use the password reset option.');
                    } else if (data.session) {
                        showMessage('success', 'Account Created!',
                            'Your account has been created successfully. Redirecting...');
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 1500);
                    } else {
                        showMessage('info', 'Check Your Email',
                            'We sent a confirmation email to ' + email,
                            'Please click the link in the email to verify your account.');
                    }
                } else {
                    showMessage('error', 'Signup Failed',
                        'Unable to create account. Please try again.',
                        'If the problem persists, contact support.');
                }
            }
        } catch (err: unknown) {
            logger.error('Auth exception', err);

            let title = 'Authentication Error';
            let description = 'An unexpected error occurred';
            let details: string | undefined = undefined;

            // Type-safe error handling
            if (err instanceof Error) {
                description = err.message;

                if (err.message.includes('Invalid login credentials')) {
                    title = 'Invalid Credentials';
                    description = 'The email or password you entered is incorrect.';
                    details = 'Please double-check your credentials and try again.';
                } else if (err.message.includes('Email not confirmed')) {
                    title = 'Email Not Confirmed';
                    description = 'Please check your email and click the confirmation link.';
                    details = 'Check your spam folder if you don\'t see the email.';
                } else if (err.message.includes('User already registered')) {
                    title = 'Account Exists';
                    description = 'An account with this email already exists.';
                    details = 'Try logging in instead, or use the "Forgot Password" option.';
                } else if (err.message.includes('Password')) {
                    title = 'Password Error';
                    description = err.message;
                    details = 'Password must be at least 6 characters long.';
                }
            }

            showMessage('error', title, description, details);
        } finally {
            setLoading(false);
        }
    };

    const handleSpotifyLogin = async () => {
        setLoading(true);
        setMessage(null);

        logger.info('Initiating Spotify OAuth', { redirectUrl: `${location.origin}/auth/callback` });

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'spotify',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                    scopes: 'user-read-email user-read-private streaming user-read-playback-state user-modify-playback-state user-read-currently-playing',
                },
            });

            logger.info('Spotify OAuth response', { data, error });

            if (error) {
                logger.error('Spotify OAuth error', error);
                throw error;
            }

            if (!data.url) {
                throw new Error('No redirect URL received from Supabase');
            }

            logger.info('Redirecting to Spotify', { url: data.url });
            // The redirect will happen automatically
        } catch (err: unknown) {
            logger.error('Spotify exception', err);

            showMessage('error', 'Spotify Login Failed',
                err instanceof Error ? err.message : 'Unable to connect to Spotify',
                'Check: 1) Spotify provider enabled in Supabase, 2) Client ID/Secret configured, 3) Redirect URLs match');

            setLoading(false);
        }
    };

    const getMessageIcon = (type: MessageType) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'info': return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getMessageStyles = (type: MessageType) => {
        switch (type) {
            case 'success': return 'bg-green-500/10 border-green-500/20 text-green-400';
            case 'error': return 'bg-red-500/10 border-red-500/20 text-red-400';
            case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
        }
    };

    return (
        <div className="w-full max-w-md p-8 glass-dark rounded-2xl shadow-2xl border border-white/10">
            <div className="flex flex-col items-center mb-8">
                <div className="p-3 bg-primary/20 rounded-full mb-4">
                    <Music2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    {isLogin ? 'Welcome Back' : 'Join the FAM'}
                </h2>
                <p className="text-muted-foreground mt-2 text-center">
                    {isLogin
                        ? 'Enter your credentials to access your station'
                        : 'Create your account and start broadcasting'}
                </p>
            </div>

            <AnimatePresence mode="wait">
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            "p-4 rounded-lg border mb-6",
                            getMessageStyles(message.type)
                        )}
                    >
                        <div className="flex items-start gap-3">
                            {getMessageIcon(message.type)}
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{message.title}</p>
                                <p className="text-sm mt-1 opacity-90">{message.description}</p>
                                {message.details && (
                                    <p className="text-xs mt-2 opacity-75 font-mono">{message.details}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-4">
                <div>
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-white/20 transition-all"
                        required
                        disabled={loading}
                        data-testid="email-input"
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-white/20 transition-all"
                        required
                        disabled={loading}
                        data-testid="password-input"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    data-testid="submit-button"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLogin ? 'Sign In' : 'Create Account'}
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#09090b] text-muted-foreground">Or continue with</span>
                </div>
            </div>

            <button
                onClick={handleSpotifyLogin}
                disabled={loading}
                className="w-full py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.46-1.02 15.66 1.44.539.3.66 1.02.359 1.56-.3.48-1.02.6-1.56.3z" />
                </svg>
                {loading ? 'Connecting...' : 'Continue with Spotify'}
            </button>

            <div className="mt-6 text-center">
                <button
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setMessage(null);
                    }}
                    className="text-sm text-muted-foreground hover:text-white transition-colors"
                    disabled={loading}
                    data-testid="auth-toggle"
                >
                    {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
            </div>
        </div>
    );
}

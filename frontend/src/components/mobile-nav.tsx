'use client';

import { Home, Radio, Search, ListMusic, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type NavItem = {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
};

const navItems: NavItem[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/radio', icon: Radio, label: 'Radio' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/playlists', icon: ListMusic, label: 'Playlists' },
    { href: '/profile', icon: User, label: 'Profile' },
];

/**
 * Mobile Navigation Component
 *
 * Bottom navigation bar optimized for mobile devices.
 * Features:
 * - Fixed bottom position
 * - Active state indication
 * - Touch-optimized tap targets (min 44x44px)
 * - Hidden on desktop (md breakpoint and above)
 */
export function MobileNav() {
    const pathname = usePathname();

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 z-50 md:hidden"
                role="navigation"
                aria-label="Mobile navigation"
            >
                <div className="flex justify-around items-center h-16 px-2 safe-area-inset-bottom">
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const isActive = pathname === href || pathname?.startsWith(href + '/');

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-1',
                                    'min-w-[64px] h-12 px-3 py-2 rounded-lg',
                                    'transition-all duration-200',
                                    'active:scale-95',
                                    isActive
                                        ? 'text-primary bg-primary/10'
                                        : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <Icon className={cn(
                                    'w-5 h-5 transition-transform',
                                    isActive && 'scale-110'
                                )} />
                                <span className={cn(
                                    'text-[10px] font-medium tracking-wide',
                                    isActive && 'font-semibold'
                                )}>
                                    {label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Spacer to prevent content from being hidden behind nav */}
            <div className="h-16 md:hidden" aria-hidden="true" />
        </>
    );
}

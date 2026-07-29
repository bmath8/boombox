'use client';

/**
 * Skip Navigation Links
 *
 * Provides skip links for keyboard users to navigate directly to main content
 * Implements WCAG 2.1 SC 2.4.1 (Bypass Blocks)
 */

interface SkipLink {
    href: string;
    label: string;
}

interface SkipLinksProps {
    links?: SkipLink[];
}

const defaultLinks: SkipLink[] = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#player', label: 'Skip to player' },
    { href: '#search', label: 'Skip to search' },
];

export function SkipLinks({ links = defaultLinks }: SkipLinksProps) {
    return (
        <div className="skip-links">
            {links.map((link) => (
                <a
                    key={link.href}
                    href={link.href}
                    className="skip-link"
                    onClick={(e) => {
                        e.preventDefault();
                        const target = document.querySelector(link.href);
                        if (target) {
                            (target as HTMLElement).focus();
                            target.scrollIntoView({ behavior: 'smooth' });
                        }
                    }}
                >
                    {link.label}
                </a>
            ))}

            <style jsx>{`
                .skip-links {
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 9999;
                }

                .skip-link {
                    position: absolute;
                    left: -9999px;
                    top: 0;
                    z-index: 999;
                    padding: 0.75rem 1.5rem;
                    background: hsl(var(--primary));
                    color: hsl(var(--primary-foreground));
                    text-decoration: none;
                    font-weight: 600;
                    border-radius: 0 0 0.5rem 0.5rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .skip-link:focus {
                    left: 1rem;
                    outline: 2px solid hsl(var(--ring));
                    outline-offset: 2px;
                }
            `}</style>
        </div>
    );
}

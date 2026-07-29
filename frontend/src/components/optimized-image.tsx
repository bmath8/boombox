'use client';

import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Music } from 'lucide-react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    className?: string;
    fallback?: React.ReactNode;
}

/**
 * Optimized Image Component
 * 
 * Features:
 * - Lazy loading with Intersection Observer
 * - Blur placeholder while loading
 * - WebP/AVIF format detection
 * - Error fallback
 * - Smooth fade-in animation
 * 
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="https://example.com/image.jpg"
 *   alt="Album cover"
 *   width={300}
 *   height={300}
 *   priority={false}
 * />
 * ```
 */
export function OptimizedImage({
    src,
    alt,
    width,
    height,
    priority = false,
    className = '',
    fallback,
}: OptimizedImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [inView, setInView] = useState(priority);

    // Generate blur placeholder (simple SVG blur)
    const blurDataURL = useMemo(() => {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width || 400} ${height || 400}'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='none' style='filter: url(%23b);' href='${src}'/%3E%3C/svg%3E`;
    }, [src, width, height]);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (priority || inView) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry && entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '50px' }
        );

        const element = document.querySelector(`[data-image-src="${src}"]`);
        if (element) {
            observer.observe(element);
        }

        return () => observer.disconnect();
    }, [src, priority, inView]);

    // Detect WebP support
    const supportsWebP = useMemo(() => {
        if (typeof window === 'undefined') return false;
        const canvas = document.createElement('canvas');
        if (canvas.getContext && canvas.getContext('2d')) {
            return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        }
        return false;
    }, []);

    // Convert to WebP if supported and original is JPG/PNG
    const optimizedSrc = useMemo(() => {
        if (supportsWebP && (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png'))) {
            return src.replace(/\.(jpg|jpeg|png)$/, '.webp');
        }
        return src;
    }, [src, supportsWebP]);

    if (error) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center bg-white/5 rounded-lg',
                    className
                )}
                style={{ width, height }}
            >
                {fallback || <Music className="w-1/3 h-1/3 text-white/20" />}
            </div>
        );
    }

    return (
        <div
            className={cn('relative overflow-hidden', className)}
            style={{ width, height }}
            data-image-src={src}
        >
            {/* Blur placeholder */}
            {!loaded && (
                <div
                    className="absolute inset-0 animate-pulse"
                    style={{
                        backgroundImage: `url('${blurDataURL}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(20px)',
                    }}
                />
            )}

            {/* Actual image */}
            {(inView || priority) && (
                <img
                    src={optimizedSrc}
                    alt={alt}
                    width={width}
                    height={height}
                    loading={priority ? 'eager' : 'lazy'}
                    onLoad={() => setLoaded(true)}
                    onError={() => {
                        // Fallback to original src if WebP fails
                        if (optimizedSrc !== src) {
                            const imgElement = document.querySelector(`[src="${optimizedSrc}"]`) as HTMLImageElement;
                            if (imgElement) {
                                imgElement.src = src;
                            }
                        } else {
                            setError(true);
                        }
                    }}
                    className={cn(
                        'w-full h-full object-cover transition-opacity duration-500',
                        loaded ? 'opacity-100' : 'opacity-0'
                    )}
                />
            )}

            {/* Loading indicator */}
            {!loaded && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}

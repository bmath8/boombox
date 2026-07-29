'use client';

/**
 * Color Extraction Utility
 * Extracts the dominant color from an image URL using canvas sampling.
 */

export async function extractDominantColor(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Required for cross-origin images

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve('#ff3333'); // Fallback color
                return;
            }

            // Sample a small portion for performance
            const sampleSize = 50;
            canvas.width = sampleSize;
            canvas.height = sampleSize;

            ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

            try {
                const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
                const data = imageData.data;

                let r = 0, g = 0, b = 0;
                let count = 0;

                // Sample every 4th pixel for speed
                for (let i = 0; i < data.length; i += 16) {
                    const red = data[i] ?? 0;
                    const green = data[i + 1] ?? 0;
                    const blue = data[i + 2] ?? 0;
                    const alpha = data[i + 3] ?? 0;

                    // Skip transparent/very dark/very light pixels
                    if (alpha > 200 && (red + green + blue) > 50 && (red + green + blue) < 700) {
                        r += red;
                        g += green;
                        b += blue;
                        count++;
                    }
                }

                if (count === 0) {
                    resolve('#ff3333');
                    return;
                }

                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);

                // Boost saturation for more vibrant colors
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const saturationBoost = 1.3;

                if (max !== min) {
                    const mid = (max + min) / 2;
                    r = Math.min(255, Math.round(mid + (r - mid) * saturationBoost));
                    g = Math.min(255, Math.round(mid + (g - mid) * saturationBoost));
                    b = Math.min(255, Math.round(mid + (b - mid) * saturationBoost));
                }

                const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                resolve(hex);
            } catch (error) {
                resolve('#ff3333'); // Fallback on any error
            }
        };

        img.onerror = () => {
            resolve('#ff3333'); // Fallback color
        };

        img.src = imageUrl;
    });
}

/**
 * Lightens or darkens a hex color
 */
export function adjustColorBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

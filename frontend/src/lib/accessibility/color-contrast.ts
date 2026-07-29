/**
 * Color Contrast Utilities
 *
 * Utilities for ensuring WCAG 2.1 color contrast compliance
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1]!, 16),
            g: parseInt(result[2]!, 16),
            b: parseInt(result[3]!, 16),
        }
        : null;
}

/**
 * Calculate relative luminance
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
        const sRGB = c / 255;
        return sRGB <= 0.03928
            ? sRGB / 12.92
            : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    }) as [number, number, number];

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsWCAG_AA(
    foreground: string,
    background: string,
    fontSize: number = 16,
    isBold: boolean = false
): boolean {
    const ratio = getContrastRatio(foreground, background);

    // Large text (18pt+ or 14pt+ bold) requires 3:1
    // Normal text requires 4.5:1
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);
    const requiredRatio = isLargeText ? 3 : 4.5;

    return ratio >= requiredRatio;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAG_AAA(
    foreground: string,
    background: string,
    fontSize: number = 16,
    isBold: boolean = false
): boolean {
    const ratio = getContrastRatio(foreground, background);

    // Large text (18pt+ or 14pt+ bold) requires 4.5:1
    // Normal text requires 7:1
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);
    const requiredRatio = isLargeText ? 4.5 : 7;

    return ratio >= requiredRatio;
}

/**
 * Get accessible text color (black or white) for a background
 */
export function getAccessibleTextColor(backgroundColor: string): string {
    const whiteRatio = getContrastRatio('#FFFFFF', backgroundColor);
    const blackRatio = getContrastRatio('#000000', backgroundColor);

    return whiteRatio > blackRatio ? '#FFFFFF' : '#000000';
}

/**
 * Validate color contrast for a design system
 */
export interface ColorPair {
    name: string;
    foreground: string;
    background: string;
    fontSize?: number;
    isBold?: boolean;
}

export interface ContrastValidationResult {
    passed: boolean;
    ratio: number;
    meetsAA: boolean;
    meetsAAA: boolean;
}

export function validateColorContrast(
    pair: ColorPair
): ContrastValidationResult {
    const ratio = getContrastRatio(pair.foreground, pair.background);
    const meetsAA = meetsWCAG_AA(
        pair.foreground,
        pair.background,
        pair.fontSize,
        pair.isBold
    );
    const meetsAAA = meetsWCAG_AAA(
        pair.foreground,
        pair.background,
        pair.fontSize,
        pair.isBold
    );

    return {
        passed: meetsAA,
        ratio,
        meetsAA,
        meetsAAA,
    };
}

/**
 * Audit all color pairs in a design system
 */
export function auditColorPairs(pairs: ColorPair[]): {
    passed: ColorPair[];
    failed: ColorPair[];
    results: Map<string, ContrastValidationResult>;
} {
    const results = new Map<string, ContrastValidationResult>();
    const passed: ColorPair[] = [];
    const failed: ColorPair[] = [];

    pairs.forEach((pair) => {
        const result = validateColorContrast(pair);
        results.set(pair.name, result);

        if (result.passed) {
            passed.push(pair);
        } else {
            failed.push(pair);
        }
    });

    return { passed, failed, results };
}

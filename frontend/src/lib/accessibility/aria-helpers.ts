/**
 * ARIA Helpers
 *
 * Utilities for managing ARIA attributes and accessibility
 */

/**
 * Generate unique ID for ARIA relationships
 */
let idCounter = 0;
export function generateId(prefix: string = 'a11y'): string {
    return `${prefix}-${++idCounter}`;
}

/**
 * Get ARIA label from element or fallback
 */
export function getAriaLabel(
    element: HTMLElement,
    fallback?: string
): string | null {
    return (
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        element.textContent ||
        fallback ||
        null
    );
}

/**
 * Set ARIA live region announcement
 */
export function announceToScreenReader(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
) {
    const liveRegion = document.getElementById('aria-live-region');
    if (!liveRegion) {
        console.warn('ARIA live region not found');
        return;
    }

    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
        liveRegion.textContent = '';
    }, 1000);
}

/**
 * Check if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
    if (element.hasAttribute('disabled')) return false;
    if (element.getAttribute('tabindex') === '-1') return false;

    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    if (focusableTags.includes(element.tagName)) return true;

    if (element.hasAttribute('tabindex')) {
        const tabindex = parseInt(element.getAttribute('tabindex') || '', 10);
        return !isNaN(tabindex) && tabindex >= 0;
    }

    return false;
}

/**
 * Get next focusable element
 */
export function getNextFocusable(
    current: HTMLElement,
    direction: 'next' | 'prev' = 'next'
): HTMLElement | null {
    const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
    );

    const currentIndex = focusables.indexOf(current);
    if (currentIndex === -1) return null;

    const nextIndex =
        direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex < 0) return focusables[focusables.length - 1] ?? null;
    if (nextIndex >= focusables.length) return focusables[0] ?? null;

    return focusables[nextIndex] ?? null;
}

/**
 * Create ARIA description for complex widgets
 */
export interface AriaDescription {
    label?: string;
    describedBy?: string;
    role?: string;
    expanded?: boolean;
    selected?: boolean;
    checked?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    live?: 'polite' | 'assertive' | 'off';
}

export function buildAriaProps(description: AriaDescription): Record<string, any> {
    const props: Record<string, any> = {};

    if (description.label) props['aria-label'] = description.label;
    if (description.describedBy) props['aria-describedby'] = description.describedBy;
    if (description.role) props['role'] = description.role;
    if (description.expanded !== undefined)
        props['aria-expanded'] = description.expanded;
    if (description.selected !== undefined)
        props['aria-selected'] = description.selected;
    if (description.checked !== undefined) props['aria-checked'] = description.checked;
    if (description.disabled) props['aria-disabled'] = true;
    if (description.required) props['aria-required'] = true;
    if (description.invalid) props['aria-invalid'] = true;
    if (description.live) props['aria-live'] = description.live;

    return props;
}

/**
 * Roving tabindex for keyboard navigation in lists
 */
export class RovingTabindex {
    private items: HTMLElement[] = [];
    private currentIndex: number = 0;

    constructor(container: HTMLElement, itemSelector: string) {
        this.items = Array.from(container.querySelectorAll(itemSelector));
        this.initialize();
    }

    private initialize() {
        this.items.forEach((item, index) => {
            item.setAttribute('tabindex', index === 0 ? '0' : '-1');
            item.addEventListener('keydown', this.handleKeyDown.bind(this));
            item.addEventListener('focus', () => this.setCurrentIndex(index));
        });
    }

    private handleKeyDown(event: KeyboardEvent) {
        let newIndex = this.currentIndex;

        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                event.preventDefault();
                newIndex = (this.currentIndex + 1) % this.items.length;
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                event.preventDefault();
                newIndex =
                    (this.currentIndex - 1 + this.items.length) % this.items.length;
                break;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = this.items.length - 1;
                break;
            default:
                return;
        }

        this.setCurrentIndex(newIndex);
        this.items[newIndex]?.focus();
    }

    private setCurrentIndex(index: number) {
        this.items[this.currentIndex]?.setAttribute('tabindex', '-1');
        this.currentIndex = index;
        this.items[this.currentIndex]?.setAttribute('tabindex', '0');
    }

    public destroy() {
        this.items.forEach((item) => {
            item.removeEventListener('keydown', this.handleKeyDown.bind(this));
        });
    }
}

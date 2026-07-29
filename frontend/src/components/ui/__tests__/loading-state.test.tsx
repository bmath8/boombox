/**
 * LoadingState Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingState } from '@/components/ui/loading-state';

describe('LoadingState Component', () => {
    describe('Skeleton Variant', () => {
        it('should render skeleton loading state', () => {
            render(<LoadingState variant="skeleton" />);

            const skeletons = screen.getAllByTestId(/skeleton-/);
            expect(skeletons.length).toBeGreaterThan(0);
        });

        it('should render custom message with skeleton', () => {
            render(<LoadingState variant="skeleton" message="Loading tracks..." />);

            expect(screen.getByText('Loading tracks...')).toBeInTheDocument();
        });

        it('should apply skeleton animation classes', () => {
            const { container } = render(<LoadingState variant="skeleton" />);

            const skeletonElements = container.querySelectorAll('.animate-pulse');
            expect(skeletonElements.length).toBeGreaterThan(0);
        });
    });

    describe('Pulse Variant', () => {
        it('should render pulse loading state', () => {
            render(<LoadingState variant="pulse" />);

            const pulseElement = screen.getByTestId('pulse-loader');
            expect(pulseElement).toBeInTheDocument();
        });

        it('should render custom message with pulse', () => {
            render(<LoadingState variant="pulse" message="Connecting..." />);

            expect(screen.getByText('Connecting...')).toBeInTheDocument();
        });

        it('should have pulse animation', () => {
            const { container } = render(<LoadingState variant="pulse" />);

            const pulseElement = container.querySelector('.animate-pulse');
            expect(pulseElement).toBeInTheDocument();
        });
    });

    describe('Spinner Variant', () => {
        it('should render spinner loading state', () => {
            render(<LoadingState variant="spinner" />);

            const spinner = screen.getByTestId('spinner-loader');
            expect(spinner).toBeInTheDocument();
        });

        it('should render custom message with spinner', () => {
            render(<LoadingState variant="spinner" message="Processing..." />);

            expect(screen.getByText('Processing...')).toBeInTheDocument();
        });

        it('should have spin animation', () => {
            const { container } = render(<LoadingState variant="spinner" />);

            const spinnerElement = container.querySelector('.animate-spin');
            expect(spinnerElement).toBeInTheDocument();
        });
    });

    describe('Default Behavior', () => {
        it('should render spinner variant by default', () => {
            render(<LoadingState />);

            const spinnerElement = screen.getByTestId('spinner-loader');
            expect(spinnerElement).toBeInTheDocument();
        });

        it('should have sr-only loading text when no message provided', () => {
            const { container } = render(<LoadingState />);

            const srOnlyText = container.querySelector('.sr-only');
            expect(srOnlyText).toHaveTextContent('Loading...');
        });
    });

    describe('Accessibility', () => {
        it('should have loading role', () => {
            const { container } = render(<LoadingState />);

            const loadingElement = container.querySelector('[role="status"]');
            expect(loadingElement).toBeInTheDocument();
        });

        it('should have aria-live attribute', () => {
            const { container } = render(<LoadingState />);

            const loadingElement = container.querySelector('[aria-live="polite"]');
            expect(loadingElement).toBeInTheDocument();
        });

        it('should have accessible message text when provided', () => {
            render(<LoadingState message="Loading data" />);

            // Check for visible message text
            expect(screen.getByText('Loading data')).toBeInTheDocument();
        });
    });
});

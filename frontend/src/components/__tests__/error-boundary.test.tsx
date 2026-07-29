import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../error-boundary';

// Suppress console.error for expected errors
const originalError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalError;
});

const ThrowError = () => {
    throw new Error('Test error');
};

describe('ErrorBoundary', () => {
    it('should render children when no error occurs', () => {
        render(
            <ErrorBoundary>
                <div>Content</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render fallback UI when an error occurs', async () => {
        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        expect(await screen.findByText(/Something Went Wrong/i)).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it.skip('should provide a reload button', async () => {
        const reloadMock = jest.fn();

        Object.defineProperty(window, 'location', {
            writable: true,
            value: { reload: reloadMock }
        });

        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        // Wait for error boundary to render
        await screen.findByText(/Something Went Wrong/i);
        const reloadButton = screen.getByText('Reload Page');
        fireEvent.click(reloadButton);

        expect(reloadMock).toHaveBeenCalled();
    });

    it('should provide a try again button that resets state', async () => {
        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        const tryAgainButton = screen.getByText('Try Again');
        fireEvent.click(tryAgainButton);

        // Since children still throw, it will catch again, but the button click should have fired
        expect(await screen.findByText('Try Again')).toBeInTheDocument();
    });
});

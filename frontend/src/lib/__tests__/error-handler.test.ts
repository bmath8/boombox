/**
 * Error Handler Tests
 */

import { handleError, AppError } from '@/lib/error-handler';

// Mock console
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock sonner - must be before import to be hoisted properly
jest.mock('sonner', () => ({
    toast: {
        error: jest.fn(),
    },
}));

import { toast } from 'sonner';
const mockToastError = toast.error as jest.Mock;

describe('Error Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('handleError', () => {
        it('should log error to console', () => {
            const error = new Error('Test error');
            handleError(error, 'Test Context');

            // handleError logs a single formatted string with the extracted message
            expect(mockConsoleError).toHaveBeenCalledWith(
                '[Test Context] Error: Test error'
            );
        });

        it('should show toast notification by default', () => {
            const error = new Error('Test error');
            handleError(error, 'Test Context');

            expect(mockToastError).toHaveBeenCalledWith(
                'Something Went Wrong',
                expect.objectContaining({
                    description: expect.stringContaining('An unexpected error occurred'),
                })
            );
        });

        it('should not show toast when silent is true', () => {
            const error = new Error('Test error');
            handleError(error, 'Test Context', false);

            expect(mockToastError).not.toHaveBeenCalled();
        });

        it('should handle Error objects', () => {
            const error = new Error('Standard error');
            handleError(error, 'Test');

            expect(mockConsoleError).toHaveBeenCalled();
        });

        it('should handle string errors', () => {
            handleError('String error', 'Test');

            expect(mockConsoleError).toHaveBeenCalled();
            expect(mockToastError).toHaveBeenCalledWith(
                'Something Went Wrong',
                expect.any(Object)
            );
        });

        it('should handle unknown error types', () => {
            handleError({ custom: 'error' }, 'Test');

            expect(mockConsoleError).toHaveBeenCalled();
            expect(mockToastError).toHaveBeenCalled();
        });

        it('should handle Supabase errors', () => {
            const supabaseError = {
                message: 'Database error',
                code: 'PGRST116',
            };

            handleError(supabaseError, 'Database Query');

            expect(mockToastError).toHaveBeenCalledWith(
                'Something Went Wrong',
                expect.any(Object)
            );
        });

        it('should handle network errors', () => {
            const networkError = new Error('Network request failed');
            networkError.name = 'NetworkError';

            handleError(networkError, 'API Call');

            expect(mockToastError).toHaveBeenCalledWith(
                'Connection Lost',
                expect.objectContaining({
                    description: 'Please check your internet connection and try again.',
                })
            );
        });
    });

    describe('AppError', () => {
        it('should create AppError with message and code', () => {
            const error = new AppError('Test error', 'TEST_CODE', 'Test error');

            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_CODE');
            expect(error.name).toBe('AppError');
        });

        it('should be instanceof Error', () => {
            const error = new AppError('Test', 'CODE', 'Test');

            expect(error instanceof Error).toBe(true);
            expect(error instanceof AppError).toBe(true);
        });

        it('should include stack trace', () => {
            const error = new AppError('Test', 'CODE', 'Test');

            expect(error.stack).toBeDefined();
        });

        it('should handle AppError in handleError', () => {
            const error = new AppError('Custom app error', 'APP_ERROR', 'Custom app error');
            handleError(error, 'Test');

            // AppError isn't automatically parsed by parseError unless added there, 
            // so it falls back to UNKNOWN_ERROR unless we modify parseError to handle AppError specifically.
            // Let's check if parseError handles it. It checks instanceof Error, but doesn't check for AppError properties specifically in the snippet I saw.
            // Wait, looking at parseError in error-messages.ts, it only checks message content for specific strings.
            // So AppError will be treated as UNKNOWN_ERROR unless the message matches a pattern.

            expect(mockToastError).toHaveBeenCalledWith(
                'Something Went Wrong',
                expect.any(Object)
            );
        });
    });

    describe('Error Context', () => {
        it('should include context in error message', () => {
            handleError(new Error('Test'), 'User Authentication');

            expect(mockConsoleError).toHaveBeenCalledWith(
                '[User Authentication] Error: Test'
            );
        });

        it('should handle empty context', () => {
            handleError(new Error('Test'), '');

            expect(mockConsoleError).toHaveBeenCalled();
        });
    });

    describe('Error Recovery', () => {
        it('should not throw when handling errors', () => {
            expect(() => {
                handleError(new Error('Test'), 'Test');
            }).not.toThrow();
        });

        it('should handle null errors gracefully', () => {
            expect(() => {
                handleError(null as any, 'Test');
            }).not.toThrow();
        });

        it('should handle undefined errors gracefully', () => {
            expect(() => {
                handleError(undefined as any, 'Test');
            }).not.toThrow();
        });
    });
});

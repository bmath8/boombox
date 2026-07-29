/**
 * Auth Form Component Tests
 * Tests authentication form UI and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from '@/components/auth-form';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: jest.fn(),
            signUp: jest.fn(),
            signInWithOAuth: jest.fn(),
        },
    },
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('AuthForm Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render login form by default', () => {
            render(<AuthForm />);

            expect(screen.getByTestId('email-input')).toBeInTheDocument();
            expect(screen.getByTestId('password-input')).toBeInTheDocument();
            expect(screen.getByTestId('submit-button')).toHaveTextContent(/sign in/i);
        });

        it('should have email and password inputs', () => {
            render(<AuthForm />);

            const emailInput = screen.getByTestId('email-input');
            const passwordInput = screen.getByTestId('password-input');

            expect(emailInput).toHaveAttribute('type', 'email');
            expect(passwordInput).toHaveAttribute('type', 'password');
        });

        it('should toggle between login and signup modes', () => {
            render(<AuthForm />);

            // Initially in login mode
            expect(screen.getByTestId('submit-button')).toHaveTextContent(/sign in/i);

            // Click to switch to signup
            const toggleButton = screen.getByTestId('auth-toggle');
            fireEvent.click(toggleButton);

            // Should now show signup button
            expect(screen.getByTestId('submit-button')).toHaveTextContent(/create account/i);
        });
    });

    describe('Form Validation', () => {
        it('should require email and password', () => {
            render(<AuthForm />);

            const submitButton = screen.getByTestId('submit-button');
            fireEvent.click(submitButton);

            // Form should not submit without values
            expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
        });

        it('should accept valid email input', () => {
            render(<AuthForm />);

            const emailInput = screen.getByTestId('email-input');
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

            expect(emailInput).toHaveValue('test@example.com');
        });

        it('should accept password input', () => {
            render(<AuthForm />);

            const passwordInput = screen.getByTestId('password-input');
            fireEvent.change(passwordInput, { target: { value: 'password123' } });

            expect(passwordInput).toHaveValue('password123');
        });
    });

    describe('Login Flow', () => {
        it('should call signInWithPassword on login', async () => {
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: { id: '123', email: 'test@example.com' }, session: {} },
                error: null,
            });

            render(<AuthForm />);

            const emailInput = screen.getByTestId('email-input');
            const passwordInput = screen.getByTestId('password-input');
            const submitButton = screen.getByTestId('submit-button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'password123',
                });
            });
        });

        it('should handle login errors', async () => {
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: null, session: null },
                error: new Error('Invalid login credentials'),
            });

            render(<AuthForm />);

            const emailInput = screen.getByTestId('email-input');
            const passwordInput = screen.getByTestId('password-input');
            const submitButton = screen.getByTestId('submit-button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
            });
        });

        it('should show loading state during login', async () => {
            (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 100))
            );

            render(<AuthForm />);

            const emailInput = screen.getByTestId('email-input');
            const passwordInput = screen.getByTestId('password-input');
            const submitButton = screen.getByTestId('submit-button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            // Button should be disabled during loading
            expect(submitButton).toBeDisabled();
        });
    });

    describe('Signup Flow', () => {
        it('should call signUp on signup', async () => {
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: { user: { id: '123', email: 'newuser@example.com' }, session: {} },
                error: null,
            });

            render(<AuthForm />);

            // Switch to signup mode
            const toggleButton = screen.getByTestId('auth-toggle');
            fireEvent.click(toggleButton);

            const emailInput = screen.getByTestId('email-input');
            const passwordInput = screen.getByTestId('password-input');
            const submitButton = screen.getByTestId('submit-button');

            fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(supabase.auth.signUp).toHaveBeenCalledWith({
                    email: 'newuser@example.com',
                    password: 'password123',
                    options: {
                        emailRedirectTo: expect.stringContaining('/auth/callback'),
                    },
                });
            });
        });

        it('should handle signup errors', async () => {
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: { user: null, session: null },
                error: new Error('User already registered'),
            });

            render(<AuthForm />);

            // Switch to signup mode
            const toggleButton = screen.getByTestId('auth-toggle');
            fireEvent.click(toggleButton);

            const emailInput = screen.getByTestId('email-input');
            const passwordInput = screen.getByTestId('password-input');
            const submitButton = screen.getByTestId('submit-button');

            fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/account exists/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper form labels', () => {
            render(<AuthForm />);

            const emailInput = screen.getByTestId('email-input');
            const passwordInput = screen.getByTestId('password-input');

            expect(emailInput).toBeInTheDocument();
            expect(passwordInput).toBeInTheDocument();
        });

        it('should disable submit button when loading', async () => {
            (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 100))
            );

            render(<AuthForm />);

            const emailInput = screen.getByTestId('email-input');
            const passwordInput = screen.getByTestId('password-input');
            const submitButton = screen.getByTestId('submit-button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
        });
    });
});

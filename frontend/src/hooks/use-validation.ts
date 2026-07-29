/**
 * React Hook for Form Validation
 * Integrates Zod schemas with React forms
 */

import { useState, useCallback } from 'react';
import { z } from 'zod';

interface ValidationErrors {
    [key: string]: string;
}

interface UseValidationResult<T> {
    errors: ValidationErrors;
    validateField: (field: keyof T, value: unknown) => boolean;
    validateForm: (data: unknown) => boolean;
    clearErrors: () => void;
    clearFieldError: (field: keyof T) => void;
    isValid: boolean;
}

/**
 * Hook for form validation with Zod schemas
 * @param schema - Zod schema to validate against
 * @returns Validation helpers and error state
 *
 * @example
 * ```tsx
 * const { errors, validateField, validateForm, clearErrors } = useValidation(createStationSchema);
 *
 * const handleSubmit = (e) => {
 *   e.preventDefault();
 *   const formData = { stationName, description };
 *
 *   if (validateForm(formData)) {
 *     // Form is valid, submit
 *     await createStation(formData);
 *   }
 * };
 *
 * const handleNameChange = (e) => {
 *   setStationName(e.target.value);
 *   validateField('stationName', e.target.value);
 * };
 * ```
 */
export function useValidation<T>(schema: z.ZodSchema<T>): UseValidationResult<T> {
    const [errors, setErrors] = useState<ValidationErrors>({});

    /**
     * Validate a single field
     */
    const validateField = useCallback((field: keyof T, value: unknown): boolean => {
        try {
            // Get the field schema
            const fieldPath = String(field);

            // Try to parse just this field
            if (schema instanceof z.ZodObject) {
                const shape = schema.shape;
                const fieldSchema = shape[field as string];

                if (fieldSchema) {
                    fieldSchema.parse(value);
                }
            }

            // Clear error for this field
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldPath];
                return newErrors;
            });

            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldPath = String(field);
                const firstError = error.issues[0];

                setErrors(prev => ({
                    ...prev,
                    [fieldPath]: firstError?.message || 'Invalid value',
                }));

                return false;
            }

            return false;
        }
    }, [schema]);

    /**
     * Validate entire form
     */
    const validateForm = useCallback((data: unknown): boolean => {
        try {
            schema.parse(data);
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: ValidationErrors = {};

                error.issues.forEach(issue => {
                    const path = issue.path.join('.');
                    newErrors[path] = issue.message;
                });

                setErrors(newErrors);
                return false;
            }

            return false;
        }
    }, [schema]);

    /**
     * Clear all errors
     */
    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    /**
     * Clear error for a specific field
     */
    const clearFieldError = useCallback((field: keyof T) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[String(field)];
            return newErrors;
        });
    }, []);

    const isValid = Object.keys(errors).length === 0;

    return {
        errors,
        validateField,
        validateForm,
        clearErrors,
        clearFieldError,
        isValid,
    };
}

/**
 * Hook for async form validation
 * Useful for validations that require API calls
 */
export function useAsyncValidation<T>() {
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isValidating, setIsValidating] = useState(false);

    /**
     * Validate field asynchronously
     */
    const validateFieldAsync = useCallback(async (
        field: keyof T,
        validator: () => Promise<string | null>
    ): Promise<boolean> => {
        setIsValidating(true);

        try {
            const error = await validator();

            if (error) {
                setErrors(prev => ({
                    ...prev,
                    [String(field)]: error,
                }));
                return false;
            }

            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[String(field)];
                return newErrors;
            });

            return true;
        } finally {
            setIsValidating(false);
        }
    }, []);

    /**
     * Clear all errors
     */
    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    const isValid = Object.keys(errors).length === 0;

    return {
        errors,
        validateFieldAsync,
        clearErrors,
        isValidating,
        isValid,
    };
}

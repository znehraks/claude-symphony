/**
 * _sample_component.tsx
 *
 * This is a sample file demonstrating the expected implementation standards.
 * Real components should be saved in PROJECT_ROOT/src/components/.
 *
 * @packageDocumentation
 * @module Components/Auth
 *
 * IMPLEMENTATION RULES: Refer to stages/03-planning/outputs/implementation.yaml
 */

// ============================================================
// 1. IMPORTS (Order matters!)
// ============================================================

// 1.1 React core
import React, { useState, useCallback, useMemo } from 'react';
import type { FC, ReactNode, FormEvent, ChangeEvent } from 'react';

// 1.2 External libraries (alphabetical)
import { clsx } from 'clsx';
import { z } from 'zod';

// 1.3 Internal components (@ alias)
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

// 1.4 Hooks
import { useAuth } from '@/hooks/useAuth';
import { useForm } from '@/hooks/useForm';

// 1.5 Utils/Constants
import { validateEmail } from '@/utils/validation';

// 1.6 Types (type-only imports)
import type { User } from '@/types/user';
import type { AuthError } from '@/types/auth';

// ============================================================
// 2. TYPES (TSDoc comments required)
// ============================================================

/**
 * Validation schema for login form using Zod
 */
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Props for the LoginForm component
 *
 * @example
 * ```tsx
 * <LoginForm
 *   onSuccess={(user) => router.push('/dashboard')}
 *   onError={(err) => toast.error(err)}
 * />
 * ```
 */
interface LoginFormProps {
  /**
   * Callback fired when login succeeds
   * @param user - The authenticated user object
   */
  onSuccess: (user: User) => void;

  /**
   * Optional callback fired when login fails
   * @param error - Error message describing the failure
   * @defaultValue undefined
   */
  onError?: (error: string) => void;

  /**
   * URL to redirect to after successful login
   * @defaultValue '/dashboard'
   */
  redirectUrl?: string;

  /**
   * Additional CSS classes to apply to the form
   */
  className?: string;

  /**
   * Whether to show the "Remember me" checkbox
   * @defaultValue true
   */
  showRememberMe?: boolean;
}

// ============================================================
// 3. CONSTANTS (Outside component for performance)
// ============================================================

/** Initial form state */
const INITIAL_FORM_STATE: LoginFormData = {
  email: '',
  password: '',
} as const;

/** Error message constants for i18n support */
const ERROR_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN: 'Password must be at least 8 characters',
  LOGIN_FAILED: 'Invalid email or password',
  NETWORK_ERROR: 'Network error. Please try again.',
} as const;

// ============================================================
// 4. COMPONENT
// ============================================================

/**
 * Login form component with email/password authentication
 *
 * Handles form validation, submission, and error states.
 * Integrates with the useAuth hook for authentication.
 *
 * @param props - {@link LoginFormProps}
 * @returns The rendered login form
 *
 * @example
 * Basic usage:
 * ```tsx
 * <LoginForm onSuccess={handleLogin} />
 * ```
 *
 * @example
 * With error handling:
 * ```tsx
 * <LoginForm
 *   onSuccess={handleLogin}
 *   onError={(err) => showToast({ type: 'error', message: err })}
 *   redirectUrl="/app"
 * />
 * ```
 *
 * @example
 * Without remember me:
 * ```tsx
 * <LoginForm
 *   onSuccess={handleLogin}
 *   showRememberMe={false}
 * />
 * ```
 */
export function LoginForm({
  onSuccess,
  onError,
  redirectUrl = '/dashboard',
  className,
  showRememberMe = true,
}: LoginFormProps): React.JSX.Element {
  // ----------------------------------------
  // 4.1 External Hooks
  // ----------------------------------------
  const { login, isLoading } = useAuth();

  // ----------------------------------------
  // 4.2 Local State
  // ----------------------------------------
  const [formData, setFormData] = useState<LoginFormData>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // ----------------------------------------
  // 4.3 Derived State (useMemo for expensive calculations)
  // ----------------------------------------
  const isFormValid = useMemo(() => {
    const result = loginSchema.safeParse(formData);
    return result.success;
  }, [formData]);

  const isSubmitDisabled = useMemo(() => {
    return !isFormValid || isLoading;
  }, [isFormValid, isLoading]);

  // ----------------------------------------
  // 4.4 Event Handlers (useCallback for referential stability)
  // ----------------------------------------

  /**
   * Handles input field changes
   */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear field error on change
      if (errors[name as keyof LoginFormData]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }

      // Clear submit error when user types
      if (submitError) {
        setSubmitError(null);
      }
    },
    [errors, submitError]
  );

  /**
   * Validates a single field
   */
  const validateField = useCallback((name: keyof LoginFormData, value: string) => {
    const fieldSchema = loginSchema.shape[name];
    const result = fieldSchema.safeParse(value);

    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message;
      setErrors((prev) => ({ ...prev, [name]: errorMessage }));
      return false;
    }

    setErrors((prev) => ({ ...prev, [name]: undefined }));
    return true;
  }, []);

  /**
   * Handles field blur for validation
   */
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      validateField(name as keyof LoginFormData, value);
    },
    [validateField]
  );

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitError(null);

      // Validate all fields
      const result = loginSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
        result.error.errors.forEach((error) => {
          const field = error.path[0] as keyof LoginFormData;
          fieldErrors[field] = error.message;
        });
        setErrors(fieldErrors);
        return;
      }

      try {
        const user = await login({
          email: formData.email,
          password: formData.password,
          rememberMe,
        });

        onSuccess(user);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : ERROR_MESSAGES.LOGIN_FAILED;

        setSubmitError(errorMessage);
        onError?.(errorMessage);
      }
    },
    [formData, rememberMe, login, onSuccess, onError]
  );

  // ----------------------------------------
  // 4.5 Render
  // ----------------------------------------
  return (
    <form
      onSubmit={handleSubmit}
      className={clsx('flex flex-col gap-4 w-full max-w-sm', className)}
      data-testid="login-form"
      noValidate
    >
      {/* Submit Error Alert */}
      {submitError && (
        <Alert
          variant="error"
          data-testid="login-error-alert"
        >
          {submitError}
        </Alert>
      )}

      {/* Email Field */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="email"
          className="text-sm font-medium text-foreground-default"
        >
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isLoading}
          error={errors.email}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          data-testid="login-email-input"
        />
        {errors.email && (
          <span
            id="email-error"
            className="text-sm text-status-error"
            role="alert"
          >
            {errors.email}
          </span>
        )}
      </div>

      {/* Password Field */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground-default"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={isLoading}
          error={errors.password}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          data-testid="login-password-input"
        />
        {errors.password && (
          <span
            id="password-error"
            className="text-sm text-status-error"
            role="alert"
          >
            {errors.password}
          </span>
        )}
      </div>

      {/* Remember Me Checkbox */}
      {showRememberMe && (
        <div className="flex items-center gap-2">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-border-default"
            data-testid="login-remember-checkbox"
          />
          <label
            htmlFor="remember-me"
            className="text-sm text-foreground-muted"
          >
            Remember me for 30 days
          </label>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={isSubmitDisabled}
        loading={isLoading}
        fullWidth
        data-testid="login-submit-button"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>

      {/* Forgot Password Link */}
      <a
        href="/forgot-password"
        className="text-sm text-interactive-default hover:underline text-center"
        data-testid="login-forgot-password-link"
      >
        Forgot your password?
      </a>
    </form>
  );
}

// ============================================================
// 5. EXPORTS
// ============================================================

// Named export is preferred (allows tree shaking)
// Default export is optional
export default LoginForm;

// Export types for consumers
export type { LoginFormProps };

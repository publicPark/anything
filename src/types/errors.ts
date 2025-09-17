/**
 * Error types for better type safety
 */

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export interface AuthError extends AppError {
  code:
    | "AUTH_ERROR"
    | "AUTH_SERVER_ERROR"
    | "AUTH_EXCHANGE_ERROR"
    | "AUTH_MISSING_CODE";
}

export interface ProfileError extends AppError {
  code:
    | "PROFILE_NOT_FOUND"
    | "PROFILE_CREATION_FAILED"
    | "PROFILE_UPDATE_FAILED";
}

export interface ValidationError extends AppError {
  code: "VALIDATION_ERROR" | "INVALID_EMAIL" | "USER_NOT_FOUND";
}

export type ErrorType = AuthError | ProfileError | ValidationError;

/**
 * Error factory functions
 */
export function createAuthError(
  code: AuthError["code"],
  message: string,
  details?: unknown
): AuthError {
  return { code, message, details };
}

export function createProfileError(
  code: ProfileError["code"],
  message: string,
  details?: unknown
): ProfileError {
  return { code, message, details };
}

export function createValidationError(
  code: ValidationError["code"],
  message: string,
  details?: unknown
): ValidationError {
  return { code, message, details };
}

/**
 * Type guard functions
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    [
      "AUTH_ERROR",
      "AUTH_SERVER_ERROR",
      "AUTH_EXCHANGE_ERROR",
      "AUTH_MISSING_CODE",
    ].includes((error as any).code)
  );
}

export function isProfileError(error: unknown): error is ProfileError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    [
      "PROFILE_NOT_FOUND",
      "PROFILE_CREATION_FAILED",
      "PROFILE_UPDATE_FAILED",
    ].includes((error as any).code)
  );
}

export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ["VALIDATION_ERROR", "INVALID_EMAIL", "USER_NOT_FOUND"].includes(
      (error as any).code
    )
  );
}

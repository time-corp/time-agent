export const ErrorCode = {
  // Generic
  INTERNAL_ERROR: "INTERNAL_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  SANDBOX_NOT_FOUND: "SANDBOX_NOT_FOUND",
  SANDBOX_EXEC_FAILED: "SANDBOX_EXEC_FAILED",
  SKILL_NOT_FOUND: "SKILL_NOT_FOUND",
  // Users
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_USERNAME_EXISTS: "USER_USERNAME_EXISTS",
  USER_EMAIL_EXISTS: "USER_EMAIL_EXISTS",
  USER_CREATE_FAILED: "USER_CREATE_FAILED",
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number = 400
  ) {
    super(message)
    this.name = "AppError"
  }
}

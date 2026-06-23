export type ToolErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "FORBIDDEN"
  | "UNKNOWN_TOOL"
  | "INTERNAL_ERROR"
  | "INVALID_JSON";

export class ToolError extends Error {
  readonly code: ToolErrorCode;
  readonly httpStatus: number;

  constructor(
    code: ToolErrorCode,
    message: string,
    httpStatus = 400,
  ) {
    super(message);
    this.name = "ToolError";
    this.code = code;
    this.httpStatus = httpStatus;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

export class ValidationError extends ToolError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message, 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ToolError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ToolError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

export class ForbiddenError extends ToolError {
  constructor(message = "Access denied") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class UnknownToolError extends ToolError {
  constructor(toolName: string) {
    super("UNKNOWN_TOOL", `Unknown tool: ${toolName}`, 400);
    this.name = "UnknownToolError";
  }
}

export function isToolError(error: unknown): error is ToolError {
  return error instanceof ToolError;
}

export function toToolFailure(error: unknown): {
  success: false;
  error: { code: string; message: string };
} {
  if (isToolError(error)) {
    return { success: false, error: error.toJSON() };
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  return {
    success: false,
    error: { code: "INTERNAL_ERROR", message },
  };
}

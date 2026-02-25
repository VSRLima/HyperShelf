import type { AppErrorCode } from "../../components/shared/error/types/AppErrorCode.type";
import { ClientError } from "./types/ClientError.type";
import { ErrorMetadata } from "./types/ErrorMetadata.type";

const APP_ERROR_MESSAGES: Record<AppErrorCode, string> = {
  CANNOT_DEMOTE_SELF: "You cannot remove your own admin role.",
  USER_NOT_FOUND: "This user could not be found. Refresh and try again.",
  INVALID_NAME: "Name cannot be empty.",
};

function isClientError(value: ClientError | null | undefined): value is ClientError {
  return Boolean(value);
}

export function getAppErrorCode(
  error: ClientError | null | undefined,
): AppErrorCode | undefined {
  if (!isClientError(error)) {
    return undefined;
  }

  const code = error.data?.code;
  if (
    code === "CANNOT_DEMOTE_SELF" ||
    code === "USER_NOT_FOUND" ||
    code === "INVALID_NAME"
  ) {
    return code;
  }

  return undefined;
}

export function getClientSafeErrorMessage(
  error: ClientError | null | undefined,
  fallback: string,
): string {
  const code = getAppErrorCode(error);
  if (!code) {
    return fallback;
  }
  return APP_ERROR_MESSAGES[code];
}

export function getClientErrorMessage(
  error: ClientError | null | undefined,
  fallback: string,
): string {
  if (isClientError(error) && error.message) {
    return error.message;
  }
  return fallback;
}

export function logClientError(
  context: string,
  error: ClientError | null | undefined,
  metadata?: ErrorMetadata,
): void {
  if (isClientError(error)) {
    console.error(`[${context}]`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      metadata,
      code: error.data?.code,
    });
    return;
  }

  console.error(`[${context}]`, {
    message: "Unknown client error",
    metadata,
  });
}

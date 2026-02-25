import test from "node:test";
import assert from "node:assert/strict";
import {
  getAppErrorCode,
  getClientErrorMessage,
  getClientSafeErrorMessage,
  logClientError,
} from "../src/lib/errors/clientError";
import type { ClientError } from "../src/lib/errors/types/ClientError.type";

test("returns mapped safe message for each known app error code", () => {
  const cases = [
    {
      code: "CANNOT_DEMOTE_SELF",
      expected: "You cannot remove your own admin role.",
    },
    {
      code: "USER_NOT_FOUND",
      expected: "This user could not be found. Refresh and try again.",
    },
    {
      code: "INVALID_NAME",
      expected: "Name cannot be empty.",
    },
  ] as const;

  for (const entry of cases) {
    const error: ClientError = { data: { code: entry.code } };
    assert.equal(getAppErrorCode(error), entry.code);
    assert.equal(getClientSafeErrorMessage(error, "Fallback"), entry.expected);
  }
});

test("returns fallback safe message for unknown app error code", () => {
  const error: ClientError = {
    data: {
      code: "SOMETHING_ELSE",
    },
  };

  assert.equal(getAppErrorCode(error), undefined);
  assert.equal(getClientSafeErrorMessage(error, "Fallback"), "Fallback");
});

test("returns undefined app code for nullish or missing code", () => {
  assert.equal(getAppErrorCode(undefined), undefined);
  assert.equal(getAppErrorCode(null), undefined);
  assert.equal(getAppErrorCode({}), undefined);
  assert.equal(getAppErrorCode({ data: {} }), undefined);
});

test("returns raw error message when available", () => {
  const error: ClientError = {
    message: "Specific failure",
  };

  assert.equal(getClientErrorMessage(error, "Fallback"), "Specific failure");
});

test("returns fallback message when no error message exists", () => {
  assert.equal(getClientErrorMessage(undefined, "Fallback"), "Fallback");
  assert.equal(getClientErrorMessage({ message: "" }, "Fallback"), "Fallback");
});

test("logClientError logs structured client error details", () => {
  const calls: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    calls.push(args);
  };

  try {
    logClientError(
      "update-user",
      {
        message: "Cannot update",
        stack: "stacktrace",
        name: "ConvexError",
        data: { code: "USER_NOT_FOUND" },
      },
      { userId: "u_1", retrying: false },
    );
  } finally {
    console.error = original;
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "[update-user]");
  assert.deepEqual(calls[0][1], {
    message: "Cannot update",
    stack: "stacktrace",
    name: "ConvexError",
    metadata: { userId: "u_1", retrying: false },
    code: "USER_NOT_FOUND",
  });
});

test("logClientError logs unknown error fallback payload", () => {
  const calls: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    calls.push(args);
  };

  try {
    logClientError("refresh", undefined, { fromCache: true });
  } finally {
    console.error = original;
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "[refresh]");
  assert.deepEqual(calls[0][1], {
    message: "Unknown client error",
    metadata: { fromCache: true },
  });
});

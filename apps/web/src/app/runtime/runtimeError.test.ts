import { afterEach, describe, expect, it, vi } from "vitest";

import { reportCaughtReactError, reportRuntimeError } from "@app/runtime/runtimeError";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("reportRuntimeError", () => {
  it("logs diagnostic error details with known credentials redacted", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const originalError = new Error("Client failed for admin-secret");
    originalError.name = "admin-secret error";

    reportRuntimeError(
      { source: "client", error: originalError },
      ["admin-secret"],
    );

    expect(consoleError).toHaveBeenCalledOnce();
    const diagnostic = consoleError.mock.calls[0]?.[1] as {
      source: string;
      error: Error;
    };
    expect(diagnostic.source).toBe("client");
    expect(diagnostic.error).not.toBe(originalError);
    expect(diagnostic.error.name).toBe("[REDACTED] error");
    expect(diagnostic.error.message).toBe("Client failed for [REDACTED]");
    expect(diagnostic.error.stack).not.toContain("admin-secret");
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("admin-secret");
  });

  it("does not pass caught React errors to the console", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const originalError = new Error("Client failed for admin-secret");

    reportCaughtReactError(originalError, { componentStack: "\n    at RuntimeBoundary" });

    expect(consoleError).toHaveBeenCalledWith("Caught React error", {
      componentStack: "\n    at RuntimeBoundary",
    });
    expect(consoleError.mock.calls.flat()).not.toContain(originalError);
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("admin-secret");
  });
});

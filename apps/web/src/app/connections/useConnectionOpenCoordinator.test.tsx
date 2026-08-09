import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useConnectionOpenCoordinator } from "./useConnectionOpenCoordinator";

describe("useConnectionOpenCoordinator", () => {
  it("ignores overlapping opens across consumers and exposes the active connection", async () => {
    let resolveOpen: (() => void) | undefined;
    const performOpen = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveOpen = resolve;
        }),
    );
    const { result } = renderHook(() => useConnectionOpenCoordinator(performOpen));

    let firstRequest: Promise<"opened" | "ignored"> | undefined;
    let secondRequest: Promise<"opened" | "ignored"> | undefined;
    act(() => {
      firstRequest = result.current.openConnection("connection-1");
      secondRequest = result.current.openConnection("connection-2");
    });

    expect(result.current.openingConnectionId).toBe("connection-1");
    await expect(secondRequest).resolves.toBe("ignored");
    expect(performOpen).toHaveBeenCalledTimes(1);
    expect(performOpen).toHaveBeenCalledWith("connection-1", undefined);

    await act(async () => {
      resolveOpen?.();
      await firstRequest;
    });

    await expect(firstRequest).resolves.toBe("opened");
    expect(result.current.openingConnectionId).toBeNull();
  });

  it("releases the coordinator after a failed open so the user can retry", async () => {
    const performOpen = vi
      .fn<(connectionId: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error("navigation failed"))
      .mockResolvedValueOnce();
    const { result } = renderHook(() => useConnectionOpenCoordinator(performOpen));

    await act(async () => {
      await expect(result.current.openConnection("connection-1")).rejects.toThrow(
        "navigation failed",
      );
    });
    expect(result.current.openingConnectionId).toBeNull();

    await act(async () => {
      await expect(result.current.openConnection("connection-1")).resolves.toBe("opened");
    });
    expect(performOpen).toHaveBeenCalledTimes(2);
  });
});

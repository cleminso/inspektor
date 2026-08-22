import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useConnectionOpenCoordinator } from "./useConnectionOpenCoordinator";

describe("useConnectionOpenCoordinator", () => {
  it("ignores overlapping opens across consumers", async () => {
    let resolveOpen: (() => void) | undefined;
    const performOpen = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveOpen = resolve;
        }),
    );
    const { result } = renderHook(() => useConnectionOpenCoordinator(performOpen));

    let firstRequest: Promise<void> | undefined;
    let secondRequest: Promise<void> | undefined;
    act(() => {
      firstRequest = result.current("connection-1");
      secondRequest = result.current("connection-2");
    });

    await expect(secondRequest).resolves.toBeUndefined();
    expect(performOpen).toHaveBeenCalledTimes(1);
    expect(performOpen).toHaveBeenCalledWith("connection-1", undefined);

    await act(async () => {
      resolveOpen?.();
      await firstRequest;
    });
  });

  it("releases the coordinator after a failed open so the user can retry", async () => {
    const performOpen = vi
      .fn<(connectionId: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error("navigation failed"))
      .mockResolvedValueOnce();
    const { result } = renderHook(() => useConnectionOpenCoordinator(performOpen));

    await act(async () => {
      await expect(result.current("connection-1")).rejects.toThrow("navigation failed");
    });
    await act(async () => {
      await expect(result.current("connection-1")).resolves.toBeUndefined();
    });
    expect(performOpen).toHaveBeenCalledTimes(2);
  });
});

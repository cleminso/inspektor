import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toasts } from "@inspector/ds";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConnectionList } from "./connectionList";

const openConnection = vi.fn<() => Promise<"opened" | "ignored">>();
let openingConnectionId: string | null = null;

vi.mock("@app/providers/inspectorSessionProvider", () => ({
  useInspectorSessionContext: () => ({
    connections: [
      {
        id: "connection-1",
        name: "Example",
        serverUrl: "https://example.com",
        appId: "app-1",
        adminSecret: "secret",
        env: "dev",
      },
    ],
    openingConnectionId,
    openConnection,
  }),
}));

afterEach(() => {
  cleanup();
  openingConnectionId = null;
  openConnection.mockReset();
  vi.restoreAllMocks();
});

describe("ConnectionList", () => {
  it("reports a saved connection failure without an unhandled rejection", async () => {
    openConnection.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const toastError = vi.spyOn(toasts, "error");
    render(<ConnectionList />);

    fireEvent.click(screen.getByRole("button", { name: /Example/ }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Couldn't validate this connection", {
        description: "Check the server URL, app ID, and admin secret.",
      }),
    );
    expect(openConnection).toHaveBeenCalledWith("connection-1");
  });

  it("disables saved connections while one is opening", () => {
    openingConnectionId = "connection-1";
    render(<ConnectionList />);

    const connection = screen.getByRole("button", { name: /Example/ });
    fireEvent.click(connection);

    expect(connection.getAttribute("aria-disabled")).toBe("true");
    expect(openConnection).not.toHaveBeenCalled();
  });
});

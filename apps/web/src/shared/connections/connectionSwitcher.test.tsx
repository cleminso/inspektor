import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toasts } from "@inspector/ds";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { StoredConnection } from "@app/connections/connections";

import { ConnectionSwitcher } from "./connectionSwitcher";

const navigate = vi.fn();
const openConnection = vi.fn<() => Promise<"opened" | "ignored">>();
let connections: StoredConnection[] = [];
let openingConnectionId: string | null = null;

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@app/providers/inspectorSessionProvider", () => ({
  useInspectorSessionContext: () => ({
    connections,
    currentConnectionId: null,
    openingConnectionId,
    openConnection,
  }),
}));

function createConnection(id: string, name: string): StoredConnection {
  return {
    id,
    name,
    serverUrl: "https://self-hosted.example.com",
    appId: `${id}-app`,
    adminSecret: `${id}-secret`,
    env: "dev",
  };
}

function openSwitcher(): void {
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Switch connection" }), {
    key: "ArrowDown",
  });
}

afterEach(() => {
  cleanup();
  connections = [];
  openingConnectionId = null;
  navigate.mockReset();
  openConnection.mockReset();
  vi.restoreAllMocks();
});

describe("ConnectionSwitcher", () => {
  it("shows only the add action when there are no saved connections", () => {
    render(<ConnectionSwitcher />);
    openSwitcher();

    expect(screen.queryByRole("combobox", { name: "Search connections" })).toBeNull();
    expect(screen.getByRole("button", { name: "Add new connection" })).toBeTruthy();
  });

  it("shows one connection and the footer without search", () => {
    connections = [createConnection("one", "First")];

    render(<ConnectionSwitcher />);
    openSwitcher();

    expect(screen.queryByRole("combobox", { name: "Search connections" })).toBeNull();
    expect(screen.getByRole("option", { name: /First/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add new connection" })).toBeTruthy();
  });

  it("shows search for multiple connections and identifies an empty filtered result", () => {
    connections = [createConnection("one", "First"), createConnection("two", "Second")];

    render(<ConnectionSwitcher />);
    openSwitcher();
    fireEvent.input(screen.getByRole("combobox", { name: "Search connections" }), {
      target: { value: "missing" },
      inputType: "insertText",
    });

    expect(screen.getByText("No matching connections.")).toBeTruthy();
  });

  it("keeps the popup open and shows a normalized toast when opening fails", async () => {
    connections = [createConnection("one", "First")];
    openConnection.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const toastError = vi.spyOn(toasts, "error");

    render(<ConnectionSwitcher />);
    openSwitcher();
    fireEvent.click(screen.getByRole("option", { name: /First/ }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Couldn't validate this connection", {
        description: "Check the server URL, app ID, and admin secret.",
      }),
    );
    expect(openConnection).toHaveBeenCalledWith("one");
    expect(screen.getByRole("option", { name: /First/ })).toBeTruthy();
  });

  it("closes the popup after a saved connection opens successfully", async () => {
    connections = [createConnection("one", "First")];
    openConnection.mockResolvedValueOnce("opened");

    render(<ConnectionSwitcher />);
    openSwitcher();
    fireEvent.click(screen.getByRole("option", { name: /First/ }));

    await waitFor(() => expect(screen.queryByRole("option", { name: /First/ })).toBeNull());
    expect(openConnection).toHaveBeenCalledWith("one");
  });

  it("disables connection choices while one is opening", () => {
    connections = [createConnection("one", "First"), createConnection("two", "Second")];
    openingConnectionId = "one";

    render(<ConnectionSwitcher />);
    openSwitcher();

    expect(screen.getByRole("option", { name: /First/ }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(screen.getByRole("option", { name: /Second/ }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(
      screen.getAllByRole("status").some((status) =>
        status.textContent?.includes("Opening connection"),
      ),
    ).toBe(true);
  });

  it("allows the popup to be dismissed while a connection is opening", () => {
    connections = [createConnection("one", "First")];
    openConnection.mockReturnValue(new Promise(() => undefined));

    render(<ConnectionSwitcher />);
    openSwitcher();
    fireEvent.click(screen.getByRole("option", { name: /First/ }));
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Switch connection" }), {
      key: "Escape",
    });

    expect(screen.queryByRole("option", { name: /First/ })).toBeNull();
  });
});

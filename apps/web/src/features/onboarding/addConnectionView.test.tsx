import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AddConnectionView } from "./addConnectionView";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

vi.mock("@app/providers/inspectorSessionProvider", () => ({
  useInspectorSessionContext: () => ({ prefill: null }),
}));

vi.mock("./useAddConnectionFlow", () => ({
  useAddConnectionFlow: () => ({
    errorMessage: null,
    fetchSchemas: vi.fn(),
    formValues: {
      name: "",
      serverUrl: "https://v2.sync.jazz.tools/",
      appId: "",
      adminSecret: "",
      env: "dev",
      branch: "main",
    },
    goBackToForm: vi.fn(),
    isSubmitting: false,
    schemaHashes: [],
    selectSchema: vi.fn(),
    step: "form",
    updateField: vi.fn(),
  }),
}));

vi.mock("./addConnectionForm", () => ({
  AddConnectionForm: () => <div>Connection form</div>,
}));

vi.mock("./schemaSwitcher", () => ({
  SchemaSwitcher: () => <div>Schema switcher</div>,
}));

afterEach(cleanup);

describe("AddConnectionView", () => {
  it("renders the connection form directly in the page content", () => {
    render(<AddConnectionView />);

    expect(screen.getByRole("link", { name: "Back" })).toBeTruthy();
    expect(screen.getByText("Connection form")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

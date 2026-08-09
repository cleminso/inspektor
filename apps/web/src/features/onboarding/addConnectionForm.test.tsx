import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AddConnectionForm } from "./addConnectionForm";

afterEach(cleanup);

describe("AddConnectionForm", () => {
  it("renders applicable connection errors inline on their field", () => {
    render(
      <AddConnectionForm
        error={{
          title: "Invalid server URL",
          description: "Enter a valid HTTP or HTTPS URL.",
          field: "serverUrl",
        }}
        formValues={{
          name: "",
          serverUrl: "ftp://example.com",
          appId: "app",
          adminSecret: "secret",
          env: "dev",
          branch: "main",
        }}
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onUpdateField={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Server URL").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Enter a valid HTTP or HTTPS URL.")).toBeTruthy();
    expect(screen.getByText("Invalid server URL")).toBeTruthy();
  });
});

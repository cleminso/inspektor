import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Input } from "./input";

afterEach(cleanup);

describe("Input", () => {
  it("exposes an explicit invalid state to assistive technology", () => {
    render(<Input aria-label="Name" invalid />);

    expect(screen.getByRole("textbox", { name: "Name" }).getAttribute("aria-invalid")).toBe("true");
  });

  it("preserves read-only native behavior", () => {
    render(<Input aria-label="Identifier" readOnly value="row-1" />);

    expect((screen.getByRole("textbox", { name: "Identifier" }) as HTMLInputElement).readOnly).toBe(true);
  });
});

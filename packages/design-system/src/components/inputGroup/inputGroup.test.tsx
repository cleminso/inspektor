import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Input } from "../input/input";
import { InputGroup } from "./inputGroup";

afterEach(cleanup);

describe("InputGroup", () => {
  it("puts a nested Input into grouped presentation", () => {
    render(
      <InputGroup>
        <Input aria-label="Domain" />
        <InputGroup.Suffix>.com</InputGroup.Suffix>
      </InputGroup>,
    );

    expect(screen.getByRole("textbox", { name: "Domain" }).getAttribute("data-grouped")).toBe("");
  });

  it("moves focus-visible treatment to the compound root", () => {
    render(
      <InputGroup>
        <Input aria-label="Domain" />
      </InputGroup>,
    );
    const input = screen.getByRole("textbox", { name: "Domain" });
    const group = input.closest('[data-slot="input-group"]');
    vi.spyOn(input, "matches").mockReturnValue(true);

    fireEvent.focus(input);

    expect(group?.getAttribute("data-focus-visible")).toBe("");

    fireEvent.blur(input);

    expect(group?.getAttribute("data-focus-visible")).toBe(null);
  });

  it("disables every interactive member through the root", () => {
    render(
      <InputGroup disabled>
        <Input aria-label="Value" />
        <InputGroup.Action label="Reveal">show</InputGroup.Action>
        <InputGroup.Checkbox label="Set value to NULL">NULL</InputGroup.Checkbox>
      </InputGroup>,
    );

    expect((screen.getByRole("textbox", { name: "Value" }) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Reveal" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("checkbox", { name: "Set value to NULL" }).getAttribute("aria-disabled")).toBe("true");
  });

  it("keeps the NULL checkbox interactive when only the Input is disabled", () => {
    const onCheckedChange = vi.fn();
    render(
      <InputGroup>
        <Input aria-label="Value" disabled />
        <InputGroup.Checkbox label="Set value to NULL" onCheckedChange={onCheckedChange}>
          NULL
        </InputGroup.Checkbox>
      </InputGroup>,
    );

    fireEvent.click(screen.getByText("NULL"));

    expect(screen.getByRole("checkbox", { name: "Set value to NULL" }).getAttribute("aria-disabled")).not.toBe("true");
    expect(onCheckedChange).toHaveBeenCalledOnce();
  });

  it("exposes persistent action state for toggle actions", () => {
    render(
      <InputGroup>
        <Input aria-label="Password" />
        <InputGroup.Action label="Hide password" pressed>
          hide
        </InputGroup.Action>
      </InputGroup>,
    );

    expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("data-pressed")).toBe("");
  });
});

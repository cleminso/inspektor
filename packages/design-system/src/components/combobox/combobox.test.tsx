import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Combobox } from "./combobox";

afterEach(cleanup);

describe("Combobox", () => {
  it("keeps the input as the generic combobox control", () => {
    render(
      <Combobox.Root items={["main"]}>
        <Combobox.InputGroup>
          <Combobox.Input aria-label="Branch" />
          <Combobox.InputTrigger />
        </Combobox.InputGroup>
        <Combobox.Content>
          <Combobox.List>
            <Combobox.Item value="main">main</Combobox.Item>
          </Combobox.List>
        </Combobox.Content>
      </Combobox.Root>,
    );

    expect(screen.getByRole("combobox", { name: "Branch" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open options" }).tabIndex).toBe(-1);
  });

  it("renders a chevron icon for the input trigger", () => {
    const { container } = render(
      <Combobox.Root items={[]}>
        <Combobox.InputGroup>
          <Combobox.Input aria-label="Branch" />
          <Combobox.InputTrigger />
        </Combobox.InputGroup>
      </Combobox.Root>,
    );

    const chevron = container.querySelector('[data-slot="combobox-chevron"] path');

    expect(chevron?.getAttribute("d")).toBe(
      "m14.06 5.5-.53.53-4.82 4.82a1 1 0 0 1-1.42 0L2.47 6.03l-.53-.53L3 4.44l.53.53L8 9.44l4.47-4.47.53-.53z",
    );
  });

  it("keeps Empty and Status as mounted live-region roots", () => {
    render(
      <Combobox.Root items={[]} defaultOpen>
        <Combobox.Input aria-label="Branch" />
        <Combobox.Content keepMounted>
          <Combobox.Empty>No branches found.</Combobox.Empty>
          <Combobox.Status>Loading branches.</Combobox.Status>
          <Combobox.List />
        </Combobox.Content>
      </Combobox.Root>,
    );

    const regions = screen.getAllByRole("status");
    const empty = regions.find((region) => region.textContent?.startsWith("No branches found."));
    const status = regions.find((region) => region.textContent?.startsWith("Loading branches."));

    expect(empty?.getAttribute("role")).toBe("status");
    expect(empty?.getAttribute("aria-live")).toBe("polite");
    expect(status?.getAttribute("role")).toBe("status");
    expect(status?.getAttribute("aria-live")).toBe("polite");
  });

  it("associates a group label with its options group", () => {
    render(
      <Combobox.Root items={["main"]} defaultOpen>
        <Combobox.Input aria-label="Branch" />
        <Combobox.Content>
          <Combobox.List>
            <Combobox.Group>
              <Combobox.GroupLabel>Local branches</Combobox.GroupLabel>
              <Combobox.Item value="main">main</Combobox.Item>
            </Combobox.Group>
          </Combobox.List>
        </Combobox.Content>
      </Combobox.Root>,
    );

    expect(screen.getByRole("group", { name: "Local branches" })).toBeTruthy();
  });

  it("moves focus-visible state to the compound input group", () => {
    render(
      <Combobox.Root items={[]}>
        <Combobox.InputGroup>
          <Combobox.Input aria-label="Branch" />
        </Combobox.InputGroup>
      </Combobox.Root>,
    );
    const input = screen.getByRole("combobox", { name: "Branch" });
    const group = input.closest('[data-slot="combobox-input-group"]');
    vi.spyOn(input, "matches").mockReturnValue(true);

    fireEvent.focus(input);
    expect(group?.getAttribute("data-focus-visible")).toBe("");

    fireEvent.blur(input);
    expect(group?.getAttribute("data-focus-visible")).toBe(null);
  });
});

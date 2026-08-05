import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { MultiSelect, type MultiSelectItem } from "./multiSelect";

const items: readonly MultiSelectItem[] = [
  { value: "design", label: "Design System", disabled: true },
  { value: "components", label: "Components" },
  { value: "tokens", label: "Design Tokens" },
];

function TestMultiSelect({ initialValue = ["design", "components"] }: { initialValue?: string[] }) {
  const [value, setValue] = useState(initialValue);

  return (
    <MultiSelect.Root items={items} value={value} onValueChange={setValue}>
      <MultiSelect.Trigger label="Choose options">Options</MultiSelect.Trigger>
      <MultiSelect.Content
        label="Options"
        searchLabel="Search options"
        searchPlaceholder="Search options..."
        emptyLabel="options"
      />
      <output aria-label="Selected values">{value.join(",")}</output>
    </MultiSelect.Root>
  );
}

afterEach(cleanup);

describe("MultiSelect", () => {
  it("uses the standard treatment on its scrolling options", () => {
    render(<TestMultiSelect />);
    fireEvent.click(screen.getByRole("button", { name: "Choose options" }));

    expect(screen.getByRole("group", { name: "Options" }).getAttribute("data-scrollbar")).toBe(
      "standard",
    );
  });

  it("opens with a focused search and exposes named checkbox rows", () => {
    render(<TestMultiSelect />);

    fireEvent.click(screen.getByRole("button", { name: "Choose options" }));

    expect(document.activeElement).toBe(screen.getByRole("searchbox", { name: "Search options" }));
    expect(screen.getByRole("checkbox", { name: "Select Design System" }).getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("checkbox", { name: "Select Components" })).toBeTruthy();
  });

  it("toggles several values without closing", () => {
    render(<TestMultiSelect />);
    fireEvent.click(screen.getByRole("button", { name: "Choose options" }));

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Components" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Design Tokens" }));

    expect(screen.getByRole("dialog", { name: "Options" })).toBeTruthy();
    expect(screen.getByRole("status", { name: "Selected values" }).textContent).toBe("design,tokens");
  });

  it("offers Check all and Only actions based on selection state", () => {
    render(<TestMultiSelect />);
    fireEvent.click(screen.getByRole("button", { name: "Choose options" }));

    fireEvent.click(screen.getByRole("button", { name: "Check all from Components" }));
    expect(screen.getByRole("status", { name: "Selected values" }).textContent).toBe("design,components,tokens");

    fireEvent.click(screen.getByRole("button", { name: "Only Design Tokens" }));
    expect(screen.getByRole("status", { name: "Selected values" }).textContent).toBe("design,tokens");
  });

  it("navigates rows and their actions with arrow keys", () => {
    render(<TestMultiSelect />);
    fireEvent.click(screen.getByRole("button", { name: "Choose options" }));

    const search = screen.getByRole("searchbox", { name: "Search options" });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    const components = screen.getByRole("checkbox", { name: "Select Components" });
    expect(document.activeElement).toBe(components);

    fireEvent.keyDown(components, { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Check all from Components" }));

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Only Design Tokens" }));

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(screen.getByRole("checkbox", { name: "Select Design Tokens" }));
  });

  it("toggles a focused checkbox with Enter", () => {
    render(<TestMultiSelect />);
    fireEvent.click(screen.getByRole("button", { name: "Choose options" }));
    const checkbox = screen.getByRole("checkbox", { name: "Select Components" });

    checkbox.focus();
    fireEvent.keyDown(checkbox, { key: "Enter" });

    expect(screen.getByRole("status", { name: "Selected values" }).textContent).toBe("design");
  });

  it("does not change a disabled option when Enter is dispatched", () => {
    render(<TestMultiSelect />);
    fireEvent.click(screen.getByRole("button", { name: "Choose options" }));

    fireEvent.keyDown(screen.getByRole("checkbox", { name: "Select Design System" }), {
      key: "Enter",
    });

    expect(screen.getByRole("status", { name: "Selected values" }).textContent).toBe("design,components");
  });

  it("preserves the consumer Trigger ref while retaining internal focus behavior", async () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <MultiSelect.Root items={items}>
        <MultiSelect.Trigger ref={ref} label="Choose options">
          Options
        </MultiSelect.Trigger>
        <MultiSelect.Content label="Options" searchLabel="Search options" emptyLabel="options" />
      </MultiSelect.Root>,
    );

    const trigger = screen.getByRole("button", { name: "Choose options" });
    expect(ref.current).toBe(trigger);

    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("searchbox", { name: "Search options" }), {
      key: "Escape",
    });

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("filters options and names the empty query", () => {
    render(<TestMultiSelect />);
    fireEvent.click(screen.getByRole("button", { name: "Choose options" }));
    const search = screen.getByRole("searchbox", { name: "Search options" });

    fireEvent.change(search, { target: { value: "missing" } });

    expect(screen.getByText('No options match "missing"')).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "Select Components" })).toBeNull();
  });

  it("closes with Escape and restores trigger focus", async () => {
    render(<TestMultiSelect />);
    const trigger = screen.getByRole("button", { name: "Choose options" });
    fireEvent.click(trigger);

    fireEvent.keyDown(screen.getByRole("searchbox", { name: "Search options" }), {
      key: "Escape",
    });

    expect(screen.queryByRole("dialog", { name: "Options" })).toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});

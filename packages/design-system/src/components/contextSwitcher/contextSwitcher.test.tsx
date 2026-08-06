import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContextSwitcher } from "./contextSwitcher";

interface ContextValue {
  id: string;
  label: string;
}

const contexts: ContextValue[] = [
  { id: "main", label: "Main" },
  { id: "preview", label: "Preview" },
];

function openSwitcher() {
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Switch context" }), {
    key: "ArrowDown",
  });
}

function Switcher({
  disabled = false,
  defaultOpen = false,
  hasDefaultValue = true,
  onOpenChange,
}: {
  disabled?: boolean;
  defaultOpen?: boolean;
  hasDefaultValue?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <ContextSwitcher.Root
      items={contexts}
      defaultValue={hasDefaultValue === true ? contexts[0] : null}
      defaultOpen={defaultOpen}
      disabled={disabled}
      onOpenChange={(open) => onOpenChange?.(open)}
      itemToStringLabel={(item) => item.label}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(item, value) => item.id === value.id}
    >
      <ContextSwitcher.Trigger label="Switch context">
        <ContextSwitcher.Value />
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Content keepMounted>
        <ContextSwitcher.Search label="Find context" />
        <ContextSwitcher.Viewport>
          <ContextSwitcher.Empty>No contexts found.</ContextSwitcher.Empty>
          <ContextSwitcher.Status>Results ready.</ContextSwitcher.Status>
          <ContextSwitcher.List>
            {(item: ContextValue) => (
              <ContextSwitcher.Item key={item.id} value={item}>
                <ContextSwitcher.ItemText label={item.label} description={item.id} />
              </ContextSwitcher.Item>
            )}
          </ContextSwitcher.List>
        </ContextSwitcher.Viewport>
        <ContextSwitcher.Footer>Manage contexts</ContextSwitcher.Footer>
      </ContextSwitcher.Content>
    </ContextSwitcher.Root>
  );
}

afterEach(cleanup);

describe("ContextSwitcher", () => {
  it("resets the query after the popup finishes closing", async () => {
    const queryWhenClosing: string[] = [];
    render(
      <Switcher
        onOpenChange={(open) => {
          if (open === false) {
            const query = screen.getByRole("combobox", { name: "Find context" }) as HTMLInputElement;
            queryWhenClosing.push(query.value);
          }
        }}
      />,
    );
    const trigger = screen.getByRole("combobox", { name: "Switch context" });

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const input = screen.getByRole("combobox", { name: "Find context" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "pre" } });
    expect(input.value).toBe("pre");

    fireEvent.keyDown(input, { key: "Escape" });
    expect(queryWhenClosing).toEqual(["pre"]);
    await waitFor(() => expect(input.value).toBe(""));
  });

  it("auto-highlights only after the user enters a non-empty query", () => {
    render(<Switcher defaultOpen hasDefaultValue={false} />);

    expect(document.querySelector('[data-highlighted=""]')).toBe(null);

    fireEvent.input(screen.getByRole("combobox", { name: "Find context" }), {
      target: { value: "pre" },
      inputType: "insertText",
    });

    expect(screen.getByRole("option", { name: /Preview/ }).getAttribute("data-highlighted")).toBe(
      "",
    );
  });

  it("supports controlled object selection", () => {
    const onValueChange = vi.fn();

    function ControlledSwitcher() {
      const [value, setValue] = useState<ContextValue | null>(contexts[0]);
      return (
        <ContextSwitcher.Root
          items={contexts}
          value={value}
          onValueChange={(nextValue, details) => {
            setValue(nextValue);
            onValueChange(nextValue, details);
          }}
          itemToStringLabel={(item) => item.label}
          itemToStringValue={(item) => item.id}
          isItemEqualToValue={(item, selected) => item.id === selected.id}
        >
          <ContextSwitcher.Trigger label="Switch context">
            <ContextSwitcher.Value />
          </ContextSwitcher.Trigger>
          <ContextSwitcher.Content>
            <ContextSwitcher.Search label="Find context" />
            <ContextSwitcher.Viewport>
              <ContextSwitcher.List>
                {(item: ContextValue) => (
                  <ContextSwitcher.Item key={item.id} value={item}>
                    <ContextSwitcher.ItemText label={item.label} />
                  </ContextSwitcher.Item>
                )}
              </ContextSwitcher.List>
            </ContextSwitcher.Viewport>
          </ContextSwitcher.Content>
        </ContextSwitcher.Root>
      );
    }

    render(<ControlledSwitcher />);
    openSwitcher();
    fireEvent.click(screen.getByRole("option", { name: "Preview" }));

    expect(onValueChange.mock.calls[0]?.[0]).toEqual(contexts[1]);
    expect(screen.getByRole("combobox", { name: "Switch context" }).textContent).toContain(
      "Preview",
    );
  });

  it("lets the Combobox trigger own the disabled behavior", () => {
    render(<Switcher disabled />);

    const trigger = screen.getByRole("combobox", { name: "Switch context" }) as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.queryByRole("combobox", { name: "Find context" })).toBe(null);
  });

  it("keeps trigger icons and labels in one constrained content row", () => {
    render(
      <ContextSwitcher.Root items={["main"]} defaultValue="main">
        <ContextSwitcher.Trigger label="Switch context" width="s">
          <svg aria-hidden="true" data-testid="context-icon" />
          <span>Main</span>
        </ContextSwitcher.Trigger>
      </ContextSwitcher.Root>,
    );

    const trigger = screen.getByRole("combobox", { name: "Switch context" });
    const content = trigger.querySelector('[data-slot="context-switcher-trigger-content"]');

    expect(trigger.getAttribute("data-width")).toBe("s");
    expect(content?.contains(screen.getByTestId("context-icon"))).toBe(true);
    expect(content?.textContent).toBe("Main");
  });

  it("composes a semantic tooltip onto the Combobox trigger", () => {
    render(
      <ContextSwitcher.Root items={["main"]} defaultValue="main">
        <ContextSwitcher.Trigger label="Switch context" tooltip={<strong>Current context</strong>}>
          Main
        </ContextSwitcher.Trigger>
      </ContextSwitcher.Root>,
    );

    const trigger = screen.getByRole("combobox", { name: "Switch context" });

    expect(trigger.hasAttribute("data-base-ui-tooltip-trigger")).toBe(true);
    expect(trigger.getAttribute("title")).toBeNull();
  });

  it("composes Content as the popup and Viewport as the scrolling results", () => {
    render(<Switcher />);
    openSwitcher();

    expect(document.querySelector('[data-slot="combobox-content"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="context-switcher-viewport"]')).toBeTruthy();
    expect(
      screen
        .getAllByRole("status")
        .find((region) => region.textContent?.startsWith("Results ready.")),
    ).toBeTruthy();
  });

  it("renders the empty live region when filtering removes every item", () => {
    render(<Switcher />);
    openSwitcher();
    fireEvent.change(screen.getByRole("combobox", { name: "Find context" }), {
      target: { value: "missing" },
    });

    const empty = screen
      .getAllByRole("status")
      .find((region) => region.textContent?.startsWith("No contexts found."));
    expect(empty?.getAttribute("role")).toBe("status");
    expect(empty?.getAttribute("aria-live")).toBe("polite");
  });
});

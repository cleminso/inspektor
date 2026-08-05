import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRef } from "react";

import { ContextMenu } from "./contextMenu";

afterEach(cleanup);

describe("ContextMenu", () => {
  it("uses the standard treatment on its bounded popup", () => {
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Canvas</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Inspect</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    expect(screen.getByRole("menu").getAttribute("data-scrollbar")).toBe("standard");
  });

  it("opens from its trigger on a context-menu event", () => {
    render(
      <ContextMenu.Root>
        <ContextMenu.Trigger>Canvas</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Inspect</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    fireEvent.contextMenu(screen.getByText("Canvas"), { clientX: 40, clientY: 60 });

    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Inspect" })).toBeTruthy();
  });

  it("supports disabled actions and link composition", () => {
    const onClick = vi.fn();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Canvas</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item disabled onClick={onClick}>
            Delete
          </ContextMenu.Item>
          <ContextMenu.LinkItem
            href="/record/1"
            closeOnClick={false}
            onClick={(event) => event.preventDefault()}
          >
            <ContextMenu.Prefix>Record</ContextMenu.Prefix>
            Open
            <ContextMenu.Suffix>New tab</ContextMenu.Suffix>
          </ContextMenu.LinkItem>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onClick).not.toHaveBeenCalled();

    const link = screen.getByRole("menuitem", { name: "Open" });
    expect(link.getAttribute("href")).toBe("/record/1");
    expect(link.querySelectorAll("[data-slot^='context-menu-']")).toHaveLength(2);
    fireEvent.click(link);
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("preserves native props and refs on presentation parts", () => {
    const prefixRef = createRef<HTMLSpanElement>();

    render(
      <ContextMenu.Prefix ref={prefixRef} slot="leading">
        Record
      </ContextMenu.Prefix>,
    );

    expect(prefixRef.current?.getAttribute("data-slot")).toBe("context-menu-prefix");
    expect(prefixRef.current?.getAttribute("slot")).toBe("leading");
  });

  it("keeps checkbox choices open and closes radio choices when requested", () => {
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Canvas</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.CheckboxItem>Snap to grid</ContextMenu.CheckboxItem>
          <ContextMenu.RadioGroup defaultValue="move">
            <ContextMenu.RadioItem value="select">Select</ContextMenu.RadioItem>
            <ContextMenu.RadioItem value="move" closeOnClick>
              Move
            </ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    const checkbox = screen.getByRole("menuitemcheckbox", { name: "Snap to grid" });
    fireEvent.click(checkbox);
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("menu")).toBeTruthy();

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Move" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

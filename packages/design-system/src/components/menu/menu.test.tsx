import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Menu } from "./menu";

afterEach(cleanup);

describe("Menu", () => {
  it("composes content and closes action items after activation", () => {
    const onClick = vi.fn();
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Item onClick={onClick}>Duplicate</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("suppresses disabled actions", () => {
    const onClick = vi.fn();
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Item disabled onClick={onClick}>
            Delete
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("renders link items with prefix and suffix presentation", () => {
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.LinkItem
            href="/settings"
            closeOnClick={false}
            onClick={(event) => event.preventDefault()}
          >
            <Menu.Prefix>Icon</Menu.Prefix>
            Settings
            <Menu.Suffix>External</Menu.Suffix>
          </Menu.LinkItem>
        </Menu.Content>
      </Menu.Root>,
    );

    const link = screen.getByRole("menuitem", { name: "Settings" });
    expect(link.getAttribute("href")).toBe("/settings");
    expect(link.querySelectorAll("[data-slot^='menu-']")).toHaveLength(2);

    fireEvent.click(link);
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("keeps checkbox and radio choices open unless closeOnClick is requested", () => {
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>View</Menu.Trigger>
        <Menu.Content>
          <Menu.CheckboxItem defaultChecked={false}>Grid</Menu.CheckboxItem>
          <Menu.RadioGroup defaultValue="comfortable">
            <Menu.RadioItem value="compact" closeOnClick>
              Compact
              <Menu.RadioItemIndicator />
            </Menu.RadioItem>
            <Menu.RadioItem value="comfortable">Comfortable</Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Root>,
    );

    const checkbox = screen.getByRole("menuitemcheckbox", { name: "Grid" });
    fireEvent.click(checkbox);
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("menu")).toBeTruthy();

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Compact" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

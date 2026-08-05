import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RelationDetails, RelationValue } from "./relationValue";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RelationValue", () => {
  it("renders only the stored ID when navigation is absent", () => {
    render(<RelationValue id="account_0123456789" />);

    expect(screen.getByText("account_0123456789")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps navigation beside the middle-truncated identifier", () => {
    render(
      <RelationValue
        id="account_0123456789"
        navigation={{ href: "/accounts/account_0123456789" }}
      />,
    );

    const link = screen.getByRole("link", { name: "account_0123456789" });
    const relationValue = link.closest('[data-slot="relation-value"]');
    const navigationIcon = relationValue?.querySelector(
      '[data-slot="relation-value-navigation-icon"]',
    );
    expect(link.getAttribute("href")).toBe("/accounts/account_0123456789");
    const middleTruncate = link.querySelector('[data-slot="middle-truncate"]');
    expect(middleTruncate).toBeTruthy();
    expect(navigationIcon).toBeTruthy();
    expect(link.contains(navigationIcon ?? null)).toBe(true);
    expect(middleTruncate?.contains(navigationIcon ?? null)).toBe(false);
    expect(link.closest('[data-typography="mono"]')).toBeTruthy();
  });

  it("does not accept detail or styling props", () => {
    // @ts-expect-error RelationValue has no resolution state.
    const stateProp = <RelationValue id="account_1" state="missing" />;
    // @ts-expect-error RelationValue has no presentation mode.
    const modeProp = <RelationValue id="account_1" mode="details" />;
    // @ts-expect-error RelationValue owns its presentation.
    const classNameProp = <RelationValue className="off-system" id="account_1" />;

    expect(stateProp).toBeTruthy();
    expect(modeProp).toBeTruthy();
    expect(classNameProp).toBeTruthy();
  });
});

describe("RelationDetails", () => {
  it("renders the stored ID and resolved display value without target or status metadata", () => {
    render(
      <RelationDetails
        id="account_0123456789-complete"
        state={{ status: "resolved", displayValue: "Ada Lovelace" }}
      />,
    );

    expect(
      screen.getByRole("textbox", { name: "Stored relation ID" }).getAttribute("value"),
    ).toBe("account_0123456789-complete");
    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy display value" })).toBeTruthy();
    expect(screen.queryByText("Target")).toBeNull();
    expect(screen.queryByText("accounts")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("copies the display value and composes optional target navigation", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(
      <RelationDetails
        id="account_0123456789-complete"
        navigation={{ href: "/accounts/account_0123456789-complete" }}
        state={{ status: "resolved", displayValue: "Ada Lovelace" }}
      />,
    );

    const storedIdInput = screen.getByRole("textbox", { name: "Stored relation ID" });
    const inputGroup = storedIdInput.closest('[data-slot="input-group"]');
    const copyButton = screen.getByRole("button", { name: "Copy display value" });
    const targetLink = screen.getByRole("link", { name: "Open target" });
    expect(inputGroup?.contains(targetLink)).toBe(true);

    fireEvent.click(copyButton);

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("Ada Lovelace"));
    expect(targetLink.getAttribute("href")).toBe(
      "/accounts/account_0123456789-complete",
    );
  });

  it("announces display-value clipboard failures", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(
      <RelationDetails id="account_1" state={{ status: "resolved", displayValue: "Ada" }} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy display value" }));

    await vi.waitFor(() => {
      expect(screen.getByText("Could not copy display value")).toBeTruthy();
    });
  });

  it("requires valid resolution states and owns its styling", () => {
    const unresolvedDisplay = (
      <RelationDetails
        id="account_1"
        // @ts-expect-error Resolved relation state requires a display value.
        state={{ status: "resolved" }}
      />
    );
    const missingDisplay = (
      <RelationDetails
        id="account_1"
        // @ts-expect-error Missing relation state cannot carry a resolved display value.
        state={{ status: "missing", displayValue: "Ada" }}
      />
    );
    const styleProp = (
      <RelationDetails
        id="account_1"
        state={{ status: "missing" }}
        // @ts-expect-error RelationDetails owns its presentation.
        style={{ color: "red" }}
      />
    );

    expect(unresolvedDisplay).toBeTruthy();
    expect(missingDisplay).toBeTruthy();
    expect(styleProp).toBeTruthy();
  });
});

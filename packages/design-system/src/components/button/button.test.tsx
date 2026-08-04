import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Button } from "./button";
import { buttonStyles } from "./button.styles";
import { getButtonVisualStyles } from "./buttonVisuals";

afterEach(cleanup);

describe("Button", () => {
  it("does not give disabled ghost actions a filled surface", () => {
    const visualStyles = getButtonVisualStyles({
      variant: "ghost",
      size: "xs",
      square: true,
      pressed: false,
      fullWidth: false,
      justify: "center",
      radius: "xs",
      orientation: null,
      disabled: true,
      hasPrefix: false,
      hasSuffix: false,
    });

    expect(visualStyles).not.toContain(buttonStyles.disabled);
  });

  it("renders an accessible square button for icon-only actions", () => {
    render(
      <Button iconOnly aria-label="Toggle panel" aria-pressed>
        <svg data-testid="panel-icon" />
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Toggle panel" });
    const icon = screen.getByTestId("panel-icon");

    expect(button.getAttribute("data-icon-only")).toBe("");
    expect(button.getAttribute("data-pressed")).toBe("");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(icon.parentElement?.getAttribute("aria-hidden")).toBe("true");
  });

  it("requires icon-only actions to use their constrained content API", () => {
    // @ts-expect-error Icon-only actions require an accessible label.
    const missingLabel = <Button iconOnly><svg /></Button>;
    // @ts-expect-error Icon-only actions do not accept labelled-button prefixes.
    const prefix = <Button iconOnly aria-label="Add item" prefix={<svg />} />;

    expect(missingLabel).toBeDefined();
    expect(prefix).toBeDefined();
  });

  it("uses disabled button semantics while loading and prevents activation", () => {
    let activationCount = 0;

    render(
      <Button loading onClick={() => {
        activationCount += 1;
      }}>
        Save changes
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save changes" });
    fireEvent.click(button);

    expect(button.getAttribute("data-disabled")).toBe("");
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(activationCount).toBe(0);
  });

  it("keeps leading content together while pushing a suffix to the far edge", () => {
    render(
      <Button fullWidth justify="between" prefix={<span>Prefix</span>} suffix={<span>Suffix</span>}>
        Label
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Label" });
    const content = button.querySelector<HTMLElement>('[data-slot="button-content"]');
    const leading = button.querySelector<HTMLElement>('[data-slot="button-leading"]');

    expect(content?.children).toHaveLength(2);
    expect(leading?.textContent).toBe("PrefixLabel");
    expect(leading?.nextElementSibling?.textContent).toBe("Suffix");
  });

  it("propagates type through a custom render target", () => {
    render(
      <Button type="submit" render={<button data-testid="submit" />}>
        Save changes
      </Button>,
    );

    const button = screen.getByTestId("submit");
    expect(button.getAttribute("type")).toBe("submit");
  });
});

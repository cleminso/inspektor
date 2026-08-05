import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as stylex from "@stylexjs/stylex";
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
      fill: false,
      alignment: "center",
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

  it("uses a full-width start-aligned row layout", () => {
    render(
      <Button layout="row" prefix={<span>Prefix</span>} suffix={<span>Suffix</span>}>
        Label
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Label" });
    const fillClassName = stylex.props(buttonStyles.fill).className;
    const alignStartClassName = stylex.props(buttonStyles.alignStart).className;

    expect(button.getAttribute("data-layout")).toBe("row");
    expect(button.getAttribute("data-full-width")).toBe("");
    expect(fillClassName).toBeDefined();
    expect(alignStartClassName).toBeDefined();
    if (fillClassName !== undefined && alignStartClassName !== undefined) {
      expect(button.classList.contains(fillClassName)).toBe(true);
      expect(button.classList.contains(alignStartClassName)).toBe(true);
    }
    expect(button.querySelector('[data-slot="button-leading"]')).toBeNull();
    expect(button.textContent).toBe("PrefixLabelSuffix");
  });

  it("retains constrained radius choices", () => {
    render(<Button radius="m">Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    const radiusClassName = stylex.props(buttonStyles.radiusM).className;

    expect(button.getAttribute("data-radius")).toBe("m");
    expect(radiusClassName).toBeDefined();
    if (radiusClassName !== undefined) {
      expect(button.classList.contains(radiusClassName)).toBe(true);
    }
  });

  it("rejects removed width and alignment combinations", () => {
    // @ts-expect-error Button content distribution is selected through layout.
    const justify = <Button justify="start">Save</Button>;
    // @ts-expect-error Button width is selected through layout.
    const fullWidth = <Button fullWidth>Save</Button>;
    // @ts-expect-error Button exposes only supported inline and row layouts.
    const fill = <Button layout="fill">Save</Button>;
    const iconLayout = (
      // @ts-expect-error Icon-only actions do not accept labelled-button layout.
      <Button iconOnly aria-label="Save" layout="row">
        <svg />
      </Button>
    );

    expect(justify).toBeDefined();
    expect(fullWidth).toBeDefined();
    expect(fill).toBeDefined();
    expect(iconLayout).toBeDefined();
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

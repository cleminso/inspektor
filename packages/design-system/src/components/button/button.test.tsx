import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Button } from "./button";

afterEach(cleanup);

describe("Button", () => {
  it("uses the flush inset for footer-aligned actions", () => {
    render(
      <Button inset="flush" size="s">
        Add new connection
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Add new connection" });

    expect(button.getAttribute("data-inset")).toBe("flush");
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

  it("supports extra-small icon actions", () => {
    render(
      <Button size="xs" shape="square" aria-label="More actions">
        More
      </Button>,
    );

    expect(screen.getByRole("button", { name: "More actions" }).getAttribute("data-size")).toBe("xs");
  });
});

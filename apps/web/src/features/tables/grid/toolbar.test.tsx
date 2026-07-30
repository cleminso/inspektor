import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Toolbar } from "./toolbar";

afterEach(cleanup);

describe("Toolbar", () => {
  it("renders primary content beside a grouped action area", () => {
    render(
      <Toolbar actions={<button type="button">Insert row</button>}>
        <span>Filter builder</span>
      </Toolbar>,
    );

    expect(screen.getByText("Filter builder")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Insert row" })).toBeTruthy();
  });
});

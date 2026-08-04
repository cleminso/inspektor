import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { JsonViewPlayground, serializeJsonViewPlayground } from "./playground";

vi.mock("@/lib/shiki", () => ({ useHighlightedCode: () => null }));

afterEach(cleanup);

describe("JsonView playground", () => {
  it("omits package defaults from the initial source", () => {
    const source = serializeJsonViewPlayground({ expandDepth: "1" });

    expect(source).not.toContain("defaultExpandDepth");
  });

  it("serializes the expansion control", () => {
    const source = serializeJsonViewPlayground({ expandDepth: "0" });

    expect(source).toContain("defaultExpandDepth={0}");
  });

  it("renders the initial JSON tree and reset control", () => {
    render(<JsonViewPlayground />);
    fireEvent.click(screen.getByRole("button", { name: "Reset controls" }));

    expect(screen.getByRole("tree", { name: "Account payload" })).not.toBeNull();
  });
});

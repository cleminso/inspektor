import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SchemaSwitcher } from "@app/shell/header/schemaSwitcher";

vi.mock("@inspector/ds", () => {
  const Part = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const List = ({ children }: { children?: React.ReactNode | ((value: string) => React.ReactNode) }) => (
    <div>{typeof children === "function" ? null : children}</div>
  );
  return {
    ContextSwitcher: {
      Root: Part,
      Trigger: Part,
      Content: Part,
      Search: Part,
      Viewport: Part,
      Status: Part,
      Empty: Part,
      List,
      Item: Part,
    },
    Text: Part,
  };
});

vi.mock("@app/providers/inspectorProvider", () => ({
  useInspectorSessionState: () => ({
    currentSchemaHash: "schema-1",
    switchSchema: vi.fn(),
  }),
  useRuntimeSchemaHashes: () => [],
  useRuntimeSchemaHashesLoading: () => true,
}));

describe("SchemaSwitcher", () => {
  it("shows discovery pending instead of an empty state when schema hashes are resolving", () => {
    render(<SchemaSwitcher />);

    expect(screen.getByText("Loading schemas...")).toBeTruthy();
    expect(screen.queryByText("No schemas available.")).toBeNull();
  });
});

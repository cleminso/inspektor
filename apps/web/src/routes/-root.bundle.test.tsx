import { describe, expect, it, vi } from "vitest";

const jazzModuleLoaded = vi.hoisted(() => vi.fn());

vi.mock("jazz-tools", () => {
  jazzModuleLoaded();

  return {
    fetchSchemaHashes: vi.fn(),
    fetchStoredPermissions: vi.fn(),
    fetchStoredWasmSchema: vi.fn(),
  };
});

vi.mock("jazz-tools/react", () => {
  jazzModuleLoaded();

  return {
    createJazzClient: vi.fn(),
  };
});

import "./__root";

describe("root route module boundary", () => {
  it("does not initialize Jazz when the application root is imported", () => {
    expect(jazzModuleLoaded).not.toHaveBeenCalled();
  });
});

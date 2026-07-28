import { afterEach, describe, expect, it, vi } from "vitest";

import {
  copyBinaryValue,
  downloadBinaryValue,
  encodeBinaryValue,
} from "@/lib/table-explorer/binaryValue";

afterEach(() => {
  vi.useRealTimers();
});

describe("binaryValue", () => {
  it("encodes bytes as hex and base64", () => {
    const value = new Uint8Array([0, 1, 254, 255]);

    expect(encodeBinaryValue(value, "hex")).toBe("0001feff");
    expect(encodeBinaryValue(value, "base64")).toBe("AAH+/w==");
  });

  it("writes the selected encoding through the application clipboard boundary", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await copyBinaryValue(new Uint8Array([255]), "hex", { writeText });

    expect(writeText).toHaveBeenCalledWith("ff");
  });

  it("rejects oversized text copies before encoding or writing to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const value = new Uint8Array(1_048_577);

    expect(() => encodeBinaryValue(value, "hex")).toThrow(
      "Binary text copy is limited to 1 MiB.",
    );
    await expect(copyBinaryValue(value, "hex", { writeText })).rejects.toThrow(
      "Binary text copy is limited to 1 MiB.",
    );
    expect(writeText).not.toHaveBeenCalled();
  });

  it("downloads the original byte view and revokes its URL asynchronously", () => {
    vi.useFakeTimers();
    const value = new Uint8Array([1, 2, 3]);
    const createObjectURL = vi.fn().mockReturnValue("blob:binary");
    const revokeObjectURL = vi.fn();
    const click = vi.fn();

    downloadBinaryValue(value, "payload.bin", {
      createObjectURL,
      revokeObjectURL,
      createAnchor: () => ({ click, download: "", href: "" }),
    });

    expect(createObjectURL).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(blob.size).toBe(value.byteLength);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:binary");
  });

  it("downloads only the bytes inside a subarray view", async () => {
    let downloadedBlob: Blob | undefined;

    downloadBinaryValue(new Uint8Array([0, 1, 2, 3]).subarray(1, 3), "payload.bin", {
      createObjectURL: (blob) => {
        downloadedBlob = blob;
        return "blob:binary";
      },
      revokeObjectURL: vi.fn(),
      createAnchor: () => ({ click: vi.fn(), download: "", href: "" }),
    });

    expect(downloadedBlob).toBeDefined();
    if (downloadedBlob === undefined) {
      throw new Error("Expected a downloaded Blob");
    }
    expect(Array.from(new Uint8Array(await downloadedBlob.arrayBuffer()))).toEqual([1, 2]);
  });
});

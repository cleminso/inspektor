import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Field } from "../field/field";
import { Textarea } from "./textarea";

afterEach(cleanup);

describe("Textarea", () => {
  it("participates in Field labeling and value changes", () => {
    const onValueChange = vi.fn();
    render(
      <Field.Root>
        <Field.Label>JSON value</Field.Label>
        <Textarea onValueChange={onValueChange} />
      </Field.Root>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "JSON value" }), {
      target: { value: '{ "enabled": true }' },
    });

    expect(onValueChange.mock.calls[0]?.[0]).toBe('{ "enabled": true }');
  });

  it("preserves read-only native behavior", () => {
    render(<Textarea aria-label="Payload" value="{}" readOnly />);

    expect((screen.getByRole("textbox", { name: "Payload" }) as HTMLTextAreaElement).readOnly).toBe(true);
  });
});

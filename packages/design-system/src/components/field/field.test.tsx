import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Input } from "../input/input";
import { InputGroup } from "../inputGroup/inputGroup";
import { Field } from "./field";

afterEach(cleanup);

describe("Field", () => {
  it("disables compound input actions with its control", () => {
    const onClick = vi.fn();
    render(
      <Field.Root disabled>
        <Field.Label>Secret</Field.Label>
        <InputGroup>
          <Input />
          <InputGroup.Action label="Reveal secret" onClick={onClick}>
            reveal
          </InputGroup.Action>
        </InputGroup>
      </Field.Root>,
    );

    const action = screen.getByRole("button", { name: "Reveal secret" }) as HTMLButtonElement;

    fireEvent.click(action);

    expect(action.disabled).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });
});

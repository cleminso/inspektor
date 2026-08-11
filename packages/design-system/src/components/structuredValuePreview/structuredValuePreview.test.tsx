import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StructuredValuePreview } from "./structuredValuePreview";

afterEach(cleanup);

describe("StructuredValuePreview", () => {
  it("renders normalized array entries and explicit continuation", () => {
    render(
      <StructuredValuePreview
        model={{
          kind: "array",
          totalCount: 6,
          entries: ['"Ada"', "3", "true"],
          continuation: "truncated",
        }}
      />,
    );

    const marker = screen.getByText("[6]");
    screen.getByText('"Ada", 3, true, …');

    expect(marker.parentElement?.getAttribute("aria-label")).toBe('[6] "Ada", 3, true, …');
    expect(marker.closest('[translate="no"]')).toBeTruthy();
  });

  it("renders normalized object entries without reading source objects", () => {
    render(
      <StructuredValuePreview
        model={{
          kind: "object",
          totalCount: 3,
          entries: [
            { label: "name", value: '"Ada"' },
            { label: "profile", value: "{…}" },
            { label: "roles", value: "[…]" },
          ],
          continuation: "complete",
        }}
      />,
    );

    expect(screen.getByText("{3}")).toBeTruthy();
    expect(screen.getByText('name: "Ada", profile: {…}, roles: […]')).toBeTruthy();
  });

  it("supports normalized scalar previews", () => {
    render(
      <StructuredValuePreview
        model={{ kind: "scalar", label: '"bounded value"', continuation: "complete" }}
      />,
    );

    expect(screen.getByText('"bounded value"')).toBeTruthy();
  });

  it("renders a lower-bound object count when the exact total is unknown", () => {
    render(
      <StructuredValuePreview
        model={{
          kind: "object",
          totalCount: null,
          entries: [
            { label: "first", value: "1" },
            { label: "second", value: "2" },
            { label: "third", value: "3" },
          ],
          continuation: "truncated",
        }}
      />,
    );

    expect(screen.getByText("{3+}")).toBeTruthy();
    expect(screen.getByText("first: 1, second: 2, third: 3, …")).toBeTruthy();
  });

  it("gives the typed JSON marker a meaningful accessible name without punctuation", () => {
    render(
      <StructuredValuePreview
        model={{ kind: "object", totalCount: 0, entries: [], continuation: "complete" }}
        variant="typedJson"
      />,
    );

    expect(screen.getByLabelText("Typed JSON value").textContent).toBe("{T}");
    expect(screen.queryByLabelText("{T}")).toBeNull();
  });

  it("rejects raw data and styling escape hatches", () => {
    // @ts-expect-error StructuredValuePreview accepts only normalized models.
    const dataProp = <StructuredValuePreview data={{ secret: "value" }} />;
    const classNameProp = (
      <StructuredValuePreview
        // @ts-expect-error StructuredValuePreview owns its presentation.
        className="off-system"
        model={{ kind: "scalar", label: "null", continuation: "complete" }}
      />
    );
    const schemaProp = (
      <StructuredValuePreview
        model={{ kind: "scalar", label: "null", continuation: "complete" }}
        // @ts-expect-error The former schema prop is not part of the API.
        schema="typed"
      />
    );

    expect(dataProp).toBeTruthy();
    expect(classNameProp).toBeTruthy();
    expect(schemaProp).toBeTruthy();
  });
});

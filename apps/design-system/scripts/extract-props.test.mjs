import assert from "node:assert/strict";
import test from "node:test";

import { extractPropsMetadata } from "./extract-props.mjs";

test("extracts Button API facts from the public package export", () => {
  const metadata = extractPropsMetadata();
  const buttonProps = metadata.button;

  assert.ok(buttonProps);
  assert.deepEqual(
    buttonProps.map(({ name }) => name),
    ["variant", "size", "loading", "fullWidth", "justify", "radius", "disabled", "render"],
  );

  const radius = buttonProps.find(({ name }) => name === "radius");
  assert.equal(radius?.defaultValue, '"xs"');
  assert.match(radius?.type ?? "", /"none".*"xs".*"s".*"m".*"l".*"xl"/);
  assert.equal(radius?.required, false);
  assert.equal(radius?.description, "Selects a design-system corner radius.");

  const ariaLabel = buttonProps.find(({ name }) => name === "aria-label");
  assert.equal(ariaLabel, undefined);
});

test("extracts runtime defaults instead of JSDoc default tags", () => {
  const metadata = extractPropsMetadata();
  const buttonProps = metadata.button ?? [];

  assert.equal(buttonProps.find(({ name }) => name === "variant")?.defaultValue, '"primary"');
  assert.equal(buttonProps.find(({ name }) => name === "size")?.defaultValue, '"m"');
  assert.equal(buttonProps.find(({ name }) => name === "loading")?.defaultValue, "false");
  assert.equal(buttonProps.find(({ name }) => name === "fullWidth")?.defaultValue, "false");
  assert.equal(buttonProps.find(({ name }) => name === "justify")?.defaultValue, '"center"');
  assert.equal(buttonProps.find(({ name }) => name === "disabled")?.defaultValue, "false");
});

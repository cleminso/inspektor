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

test("extracts Input API facts from the public package export", () => {
  const metadata = extractPropsMetadata();
  const inputProps = metadata.input;

  assert.ok(inputProps);
  assert.deepEqual(
    inputProps.map(({ name }) => name),
    ["size", "fullWidth", "disabled", "defaultValue", "value", "onValueChange", "render"],
  );
  assert.equal(inputProps.find(({ name }) => name === "size")?.defaultValue, '"m"');
  assert.equal(inputProps.find(({ name }) => name === "fullWidth")?.defaultValue, "false");
  assert.equal(
    inputProps.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    inputProps.find(({ name }) => name === "style"),
    undefined,
  );
});

test("extracts compound Field part API facts from the public package export", () => {
  const metadata = extractPropsMetadata();

  assert.deepEqual(
    metadata["field.root"]?.map(({ name }) => name),
    [
      "disabled",
      "name",
      "invalid",
      "dirty",
      "touched",
      "validate",
      "validationMode",
      "validationDebounceTime",
      "actionsRef",
      "render",
    ],
  );
  assert.deepEqual(
    metadata["field.label"]?.map(({ name }) => name),
    ["nativeLabel", "render"],
  );
  assert.deepEqual(
    metadata["field.description"]?.map(({ name }) => name),
    ["render"],
  );
  assert.deepEqual(
    metadata["field.error"]?.map(({ name }) => name),
    ["match", "render"],
  );
  assert.equal(
    metadata["field.root"]?.find(({ name }) => name === "disabled")?.defaultValue,
    "false",
  );
  assert.equal(
    metadata["field.label"]?.find(({ name }) => name === "nativeLabel")?.defaultValue,
    "true",
  );
});

test("extracts compound Fieldset part API facts from the public package export", () => {
  const metadata = extractPropsMetadata();

  assert.deepEqual(
    metadata["fieldset.root"]?.map(({ name }) => name),
    ["disabled", "render"],
  );
  assert.deepEqual(
    metadata["fieldset.legend"]?.map(({ name }) => name),
    ["render"],
  );
  assert.equal(
    metadata["fieldset.root"]?.find(({ name }) => name === "disabled")?.defaultValue,
    "false",
  );
});

test("extracts Form API facts from the public package export", () => {
  const metadata = extractPropsMetadata();
  const formProps = metadata.form;

  assert.deepEqual(
    formProps?.map(({ name }) => name),
    ["validationMode", "errors", "onFormSubmit", "actionsRef", "onSubmit", "action", "render"],
  );
  assert.equal(
    formProps?.find(({ name }) => name === "validationMode")?.defaultValue,
    '"onSubmit"',
  );
  assert.equal(formProps?.find(({ name }) => name === "className"), undefined);
  assert.equal(formProps?.find(({ name }) => name === "style"), undefined);
});

test("extracts Checkbox API facts from the public package export", () => {
  const metadata = extractPropsMetadata();
  const checkboxProps = metadata.checkbox;

  assert.ok(checkboxProps);
  assert.deepEqual(
    checkboxProps.map(({ name }) => name),
    [
      "size",
      "checked",
      "defaultChecked",
      "onCheckedChange",
      "indeterminate",
      "name",
      "value",
      "uncheckedValue",
      "disabled",
      "readOnly",
      "required",
      "nativeButton",
      "inputRef",
      "render",
    ],
  );
  assert.equal(checkboxProps.find(({ name }) => name === "size")?.defaultValue, '"m"');
  assert.equal(checkboxProps.find(({ name }) => name === "disabled")?.defaultValue, "false");
  assert.equal(checkboxProps.find(({ name }) => name === "className"), undefined);
  assert.equal(checkboxProps.find(({ name }) => name === "style"), undefined);
});

test("extracts TextField composition props from the public package export", () => {
  const metadata = extractPropsMetadata();
  const textFieldProps = metadata.textField;

  assert.ok(textFieldProps);
  assert.ok(textFieldProps.some(({ name }) => name === "label"));
  assert.ok(textFieldProps.some(({ name }) => name === "description"));
  assert.ok(textFieldProps.some(({ name }) => name === "error"));
  assert.ok(textFieldProps.some(({ name }) => name === "invalid"));
  assert.ok(textFieldProps.some(({ name }) => name === "size"));
  assert.equal(textFieldProps.find(({ name }) => name === "fullWidth")?.defaultValue, "true");
  assert.equal(textFieldProps.find(({ name }) => name === "className"), undefined);
  assert.equal(textFieldProps.find(({ name }) => name === "style"), undefined);
});

test("extracts the constrained Search API", () => {
  const metadata = extractPropsMetadata();
  const searchProps = metadata.search;

  assert.deepEqual(
    searchProps?.map(({ name }) => name),
    ["size", "fullWidth", "disabled", "defaultValue", "value", "onValueChange"],
  );
  assert.equal(searchProps?.find(({ name }) => name === "size")?.defaultValue, '"m"');
  assert.equal(searchProps?.find(({ name }) => name === "fullWidth")?.defaultValue, "true");
  assert.equal(searchProps?.find(({ name }) => name === "className"), undefined);
  assert.equal(searchProps?.find(({ name }) => name === "preSlot"), undefined);
});

test("extracts the constrained Menu compound API", () => {
  const metadata = extractPropsMetadata();

  assert.equal(metadata["menu.root"]?.find(({ name }) => name === "defaultOpen")?.defaultValue, "false");
  assert.equal(metadata["menu.trigger"]?.find(({ name }) => name === "disabled")?.defaultValue, "false");
  assert.equal(metadata["menu.positioner"]?.find(({ name }) => name === "sideOffset")?.defaultValue, "4");
  assert.equal(metadata["menu.popup"]?.find(({ name }) => name === "width")?.defaultValue, '"content"');
  assert.match(metadata["menu.popup"]?.find(({ name }) => name === "width")?.type ?? "", /"content".*"anchor"/);
  assert.equal(metadata["menu.item"]?.find(({ name }) => name === "closeOnClick")?.defaultValue, "true");
  assert.equal(metadata["menu.item"]?.find(({ name }) => name === "variant")?.defaultValue, '"default"');
  assert.match(metadata["menu.item"]?.find(({ name }) => name === "variant")?.type ?? "", /"default".*"danger"/);
  assert.equal(metadata["menu.item"]?.find(({ name }) => name === "className"), undefined);
  assert.ok(metadata["menu.group"]);
  assert.ok(metadata["menu.groupLabel"]);
  assert.equal(metadata["menu.groupLabel"]?.find(({ name }) => name === "className"), undefined);
  assert.ok(metadata["menu.shortcut"]?.some(({ name }) => name === "render"));
  assert.equal(metadata["menu.shortcut"]?.find(({ name }) => name === "className"), undefined);
});

test("extracts the constrained Combobox compound API", () => {
  const metadata = extractPropsMetadata();

  assert.equal(metadata["combobox.root"]?.find(({ name }) => name === "disabled")?.defaultValue, "false");
  assert.equal(metadata["combobox.root"]?.find(({ name }) => name === "defaultOpen")?.defaultValue, "false");
  assert.equal(metadata["combobox.trigger"]?.find(({ name }) => name === "variant")?.defaultValue, '"ghost"');
  assert.equal(metadata["combobox.inputTrigger"]?.find(({ name }) => name === "disabled")?.defaultValue, "false");
  assert.equal(metadata["combobox.input"]?.find(({ name }) => name === "size"), undefined);
  assert.equal(metadata["combobox.popup"]?.find(({ name }) => name === "width")?.defaultValue, '"anchor"');
  assert.match(metadata["combobox.popup"]?.find(({ name }) => name === "width")?.type ?? "", /"anchor".*"content"/);
  assert.equal(metadata["combobox.viewport"]?.find(({ name }) => name === "maxHeight")?.defaultValue, '"m"');
  assert.equal(metadata["combobox.positioner"]?.find(({ name }) => name === "sideOffset")?.defaultValue, "4");
  assert.equal(metadata["combobox.clear"], undefined);
  assert.deepEqual(metadata["combobox.itemText"]?.map(({ name }) => name), ["label", "description"]);
  assert.ok(metadata["combobox.label"]);
  assert.ok(metadata["combobox.value"]);
  assert.ok(metadata["combobox.popupHeader"]);
  assert.ok(metadata["combobox.popupFooter"]);
  assert.ok(metadata["combobox.separator"]);
  assert.equal(metadata["combobox.input"]?.find(({ name }) => name === "style"), undefined);
});

test("extracts the constrained Select compound API", () => {
  const metadata = extractPropsMetadata();

  assert.equal(metadata["select.root"]?.find(({ name }) => name === "disabled")?.defaultValue, "false");
  assert.equal(metadata["select.trigger"]?.find(({ name }) => name === "size")?.defaultValue, '"m"');
  assert.equal(metadata["select.positioner"]?.find(({ name }) => name === "sideOffset")?.defaultValue, "4");
  assert.equal(metadata["select.itemIndicator"]?.find(({ name }) => name === "keepMounted")?.defaultValue, "false");
  assert.equal(metadata["select.trigger"]?.find(({ name }) => name === "className"), undefined);
});

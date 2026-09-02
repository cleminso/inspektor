import assert from "node:assert/strict";
import test from "node:test";

import { extractPropsMetadata } from "./extract-props.mjs";

const metadata = extractPropsMetadata();

test("extracts documented Accordion and ActionList props", () => {

  assert.deepEqual(
    metadata["accordion.panel"]?.map(({ name }) => name),
    ["children", "keepMounted", "hiddenUntilFound"],
  );
  assert.deepEqual(
    metadata["actionList.root"]?.map(({ name }) => name),
    ["onEscapeKeyDown", "children", "aria-label", "aria-labelledby"],
  );
  assert.deepEqual(
    metadata["actionList.trigger"]?.map(({ name }) => name),
    ["children", "prefix", "disabled", "nativeButton", "render"],
  );
  assert.deepEqual(
    metadata["actionList.action"]?.map(({ name }) => name),
    ["aria-label", "disabled", "render"],
  );
});

test("extracts the constrained AlertDialog compound API", () => {
  assert.deepEqual(
    metadata["alertDialog.root"]?.map(({ name }) => name),
    ["defaultOpen", "open", "onOpenChange"],
  );
  assert.equal(
    metadata["alertDialog.root"]?.find(({ name }) => name === "defaultOpen")?.defaultValue,
    "false",
  );
  assert.deepEqual(
    metadata["alertDialog.content"]?.map(({ name }) => name),
    ["keepMounted", "initialFocus", "finalFocus"],
  );
  assert.deepEqual(
    metadata["alertDialog.close"]?.map(({ name }) => name),
    ["render"],
  );
  assert.equal(
    metadata["alertDialog.close"]?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.ok(metadata["alertDialog.title"]);
  assert.ok(metadata["alertDialog.description"]);
  assert.ok(metadata["alertDialog.actions"]);
});

test("extracts direct and compound forwardRef component props", () => {

  assert.ok(metadata.input?.some(({ name }) => name === "size"));
  assert.ok(metadata["select.trigger"]?.some(({ name }) => name === "placeholder"));
  assert.ok(metadata.box?.some(({ name }) => name === "overflow"));
  assert.equal(metadata.box?.some(({ name }) => name === "scrollbar"), false);
  assert.doesNotMatch(
    metadata.box?.find(({ name }) => name === "padding")?.type ?? "",
    /\bT\b/,
  );
  assert.doesNotMatch(metadata.box?.find(({ name }) => name === "as")?.type ?? "", /\bE\b/);
});

test("preserves explicit null in public prop types", () => {

  assert.match(
    metadata["select.root"]?.find(({ name }) => name === "value")?.type ?? "",
    /null/,
  );
  assert.match(
    metadata["workspaceTabs.root"]?.find(({ name }) => name === "value")?.type ?? "",
    /null/,
  );
});

test("extracts Button API facts from the public package export", () => {
  const buttonProps = metadata.button;

  assert.ok(buttonProps);
  assert.deepEqual(
    buttonProps.map(({ name }) => name),
    [
      "variant",
      "size",
      "loading",
      "radius",
      "glyphSize",
      "disabled",
      "focusableWhenDisabled",
      "render",
      "iconOnly",
      "layout",
      "prefix",
      "suffix",
      "aria-label",
    ],
  );

  const radius = buttonProps.find(({ name }) => name === "radius");
  assert.equal(radius?.defaultValue, '"xs"');
  for (const value of ['"none"', '"xs"', '"s"', '"m"']) {
    assert.match(radius?.type ?? "", new RegExp(value));
  }
  assert.doesNotMatch(radius?.type ?? "", /"l"|"xl"/);
  assert.equal(radius?.required, false);
  assert.equal(radius?.description, "Selects a design-system corner radius.");

  const glyphSize = buttonProps.find(({ name }) => name === "glyphSize");
  assert.equal(glyphSize?.defaultValue, '"standard"');
  assert.match(glyphSize?.type ?? "", /"standard"/);
  assert.match(glyphSize?.type ?? "", /"compact"/);

  const layout = buttonProps.find(({ name }) => name === "layout");
  assert.equal(layout?.defaultValue, '"inline"');
  for (const value of ['"inline"', '"row"', '"fill"', '"stacked"']) {
    assert.match(layout?.type ?? "", new RegExp(value));
  }
  assert.equal(layout?.required, false);
  assert.equal(
    layout?.description,
    "Selects inline, leading-aligned row, centered fill, or padded stacked action layout.",
  );

  const ariaLabel = buttonProps.find(({ name }) => name === "aria-label");
  assert.ok(ariaLabel);

  const size = buttonProps.find(({ name }) => name === "size");
  for (const value of ['"xs"', '"s"', '"m"']) {
    assert.match(size?.type ?? "", new RegExp(value));
  }
  assert.doesNotMatch(size?.type ?? "", /"l"/);
});

test("extracts Button Glyph API facts from the public compound export", () => {
  const glyphProps = metadata["button.glyph"];

  assert.ok(glyphProps);
  assert.deepEqual(
    glyphProps.map(({ name }) => name),
    ["artwork"],
  );
  assert.equal(glyphProps[0]?.required, true);
  assert.equal(
    glyphProps[0]?.description,
    "SVG artwork rendered at the size selected by the surrounding button.",
  );
});

test("extracts the constrained Icon artwork API", () => {
  const iconProps = metadata.icon;

  assert.ok(iconProps);
  assert.deepEqual(
    iconProps.map(({ name }) => name),
    ["artwork", "size"],
  );
  assert.equal(iconProps.find(({ name }) => name === "artwork")?.required, true);
  assert.equal(iconProps.find(({ name }) => name === "size")?.defaultValue, '"s"');
});

test("extracts the semantic TextLink API", () => {

  assert.deepEqual(
    metadata.textLink?.map(({ name }) => name),
    ["variant", "trailingIcon", "href", "render"],
  );
  assert.equal(
    metadata.textLink?.find(({ name }) => name === "variant")?.defaultValue,
    '"default"',
  );
  assert.equal(
    metadata.textLink?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    metadata.textLink?.find(({ name }) => name === "style"),
    undefined,
  );
});

test("extracts ButtonLink navigation and presentation props", () => {

  assert.deepEqual(
    metadata.buttonLink?.map(({ name }) => name),
    [
      "variant",
      "size",
      "radius",
      "href",
      "render",
      "iconOnly",
      "layout",
      "prefix",
      "suffix",
      "aria-label",
    ],
  );
  assert.equal(
    metadata.buttonLink?.find(({ name }) => name === "variant")?.defaultValue,
    '"primary"',
  );
  assert.equal(
    metadata.buttonLink?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    metadata.buttonLink?.find(({ name }) => name === "disabled"),
    undefined,
  );
  assert.equal(
    metadata.buttonLink?.find(({ name }) => name === "loading"),
    undefined,
  );
});

test("extracts runtime defaults instead of JSDoc default tags", () => {
  const buttonProps = metadata.button ?? [];

  assert.equal(buttonProps.find(({ name }) => name === "variant")?.defaultValue, '"primary"');
  assert.equal(buttonProps.find(({ name }) => name === "size")?.defaultValue, '"m"');
  assert.equal(buttonProps.find(({ name }) => name === "loading")?.defaultValue, "false");
  assert.equal(buttonProps.find(({ name }) => name === "iconOnly")?.defaultValue, "false");
  assert.equal(buttonProps.find(({ name }) => name === "radius")?.defaultValue, '"xs"');
  assert.equal(buttonProps.find(({ name }) => name === "layout")?.defaultValue, '"inline"');
  assert.equal(buttonProps.find(({ name }) => name === "disabled")?.defaultValue, "false");
});

test("extracts the constrained CopyButton API", () => {
  const copyButtonProps = metadata.copyButton;

  assert.deepEqual(
    copyButtonProps?.map(({ name }) => name),
    [
      "textToCopy",
      "label",
      "copiedLabel",
      "errorLabel",
      "size",
      "variant",
      "disabled",
      "tooltipSide",
      "onCopy",
      "onCopyError",
    ],
  );
  assert.equal(
    copyButtonProps?.find(({ name }) => name === "copiedLabel")?.defaultValue,
    '"Copied"',
  );
  assert.equal(copyButtonProps?.find(({ name }) => name === "size")?.defaultValue, '"s"');
  assert.equal(copyButtonProps?.find(({ name }) => name === "variant")?.defaultValue, '"ghost"');
  assert.equal(
    copyButtonProps?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    copyButtonProps?.find(({ name }) => name === "children"),
    undefined,
  );
});

test("extracts the constrained resizable panel APIs", () => {

  assert.deepEqual(
    metadata.resizablePanelGroup?.map(({ name }) => name),
    [
      "orientation",
      "defaultLayout",
      "disabled",
      "disableCursor",
      "id",
      "onLayoutChange",
      "onLayoutChanged",
      "groupRef",
      "elementRef",
    ],
  );
  assert.equal(
    metadata.resizablePanelGroup?.find(({ name }) => name === "orientation")?.defaultValue,
    '"horizontal"',
  );
  assert.deepEqual(
    metadata.resizablePanel?.map(({ name }) => name),
    [
      "id",
      "defaultSize",
      "minSize",
      "maxSize",
      "collapsedSize",
      "collapsible",
      "disabled",
      "groupResizeBehavior",
      "onResize",
      "panelRef",
      "elementRef",
    ],
  );
  assert.equal(
    metadata.resizablePanel?.find(({ name }) => name === "groupResizeBehavior")?.defaultValue,
    '"preserve-relative-size"',
  );
  assert.deepEqual(
    metadata.resizableHandle?.map(({ name }) => name),
    ["appearance", "id", "disabled", "disableDoubleClick", "elementRef"],
  );
  assert.equal(
    metadata.resizableHandle?.find(({ name }) => name === "appearance")?.defaultValue,
    '"line"',
  );
  assert.equal(
    metadata.resizablePanelGroup?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    metadata.resizablePanel?.find(({ name }) => name === "style"),
    undefined,
  );
  assert.equal(
    metadata.resizableHandle?.find(({ name }) => name === "className"),
    undefined,
  );
});

test("extracts the constrained Shell Layout compound API", () => {
  assert.deepEqual(
    metadata["shellLayout.root"]?.map(({ name }) => name),
    ["persistence", "children"],
  );
  for (const part of ["header", "body", "leftDock", "view", "rightDock", "footer"]) {
    assert.deepEqual(
      metadata[`shellLayout.${part}`]?.map(({ name }) => name),
      ["children"],
    );
  }
});

test("extracts the constrained Switch API", () => {
  const switchProps = metadata.switch;

  assert.deepEqual(
    switchProps?.map(({ name }) => name),
    [
      "size",
      "checked",
      "defaultChecked",
      "onCheckedChange",
      "name",
      "value",
      "form",
      "uncheckedValue",
      "disabled",
      "readOnly",
      "required",
      "nativeButton",
      "inputRef",
      "render",
    ],
  );
  assert.equal(switchProps?.find(({ name }) => name === "size")?.defaultValue, '"m"');
  assert.equal(switchProps?.find(({ name }) => name === "disabled")?.defaultValue, "false");
  assert.equal(
    switchProps?.find(({ name }) => name === "className"),
    undefined,
  );
});

test("extracts the constrained Tooltip compound API", () => {

  assert.deepEqual(
    metadata["tooltip.provider"]?.map(({ name }) => name),
    ["delay", "closeDelay", "timeout"],
  );
  assert.equal(
    metadata["tooltip.provider"]?.find(({ name }) => name === "delay")?.defaultValue,
    "500",
  );
  assert.equal(
    metadata["tooltip.provider"]?.find(({ name }) => name === "closeDelay")?.defaultValue,
    "100",
  );
  assert.equal(
    metadata["tooltip.provider"]?.find(({ name }) => name === "timeout")?.defaultValue,
    "400",
  );
  assert.deepEqual(
    metadata["tooltip.root"]?.map(({ name }) => name),
    [
      "defaultOpen",
      "open",
      "onOpenChange",
      "onOpenChangeComplete",
      "disableHoverablePopup",
      "trackCursorAxis",
      "actionsRef",
      "disabled",
    ],
  );
  assert.equal(
    metadata["tooltip.root"]?.find(({ name }) => name === "defaultOpen")?.defaultValue,
    "false",
  );
  assert.deepEqual(
    metadata["tooltip.trigger"]?.map(({ name }) => name),
    ["delay", "closeOnClick", "closeDelay", "disabled", "render"],
  );
  assert.equal(
    metadata["tooltip.trigger"]?.find(({ name }) => name === "delay")?.defaultValue,
    undefined,
  );
  assert.equal(
    metadata["tooltip.trigger"]?.find(({ name }) => name === "closeOnClick")?.defaultValue,
    "true",
  );
  assert.equal(
    metadata["tooltip.trigger"]?.find(({ name }) => name === "closeDelay")?.defaultValue,
    undefined,
  );
  assert.deepEqual(
    metadata["tooltip.content"]?.map(({ name }) => name),
    ["side", "align"],
  );
  assert.equal(
    metadata["tooltip.content"]?.find(({ name }) => name === "side")?.defaultValue,
    '"top"',
  );
  assert.equal(
    metadata["tooltip.trigger"]?.find(({ name }) => name === "className"),
    undefined,
  );
});

test("extracts the constrained Toaster API", () => {
  const toasterProps = metadata.toaster;

  assert.deepEqual(
    toasterProps?.map(({ name }) => name),
    [],
  );
  assert.equal(
    toasterProps?.find(({ name }) => name === "className"),
    undefined,
  );
});

test("extracts the Spinner API", () => {

  assert.deepEqual(
    metadata.spinner?.map(({ name }) => name),
    ["label", "size"],
  );
  assert.equal(metadata.spinner?.find(({ name }) => name === "size")?.defaultValue, '"m"');
  assert.equal(
    metadata.spinner?.find(({ name }) => name === "className"),
    undefined,
  );
});

test("extracts the constrained JsonView API", () => {
  const jsonViewProps = metadata.jsonView;

  assert.deepEqual(
    jsonViewProps?.map(({ name }) => name),
    ["accessibilityLabel", "data", "defaultExpandDepth", "showRootActions", "search"],
  );
  assert.equal(jsonViewProps?.find(({ name }) => name === "defaultExpandDepth")?.defaultValue, "1");
  assert.equal(
    jsonViewProps?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    jsonViewProps?.find(({ name }) => name === "style"),
    undefined,
  );
});

test("extracts the constrained CodeEditor API", () => {
  const codeEditorProps = metadata.codeEditor;

  assert.deepEqual(
    codeEditorProps?.map(({ name }) => name),
    [
      "value",
      "onValueChange",
      "accessibilityLabel",
      "id",
      "labelledBy",
      "describedBy",
      "readOnly",
      "disabled",
      "invalid",
      "expanded",
      "defaultExpanded",
      "onExpandedChange",
      "layout",
      "focusOnMount",
    ],
  );
  assert.equal(
    codeEditorProps?.find(({ name }) => name === "defaultExpanded")?.defaultValue,
    "false",
  );
  assert.equal(codeEditorProps?.find(({ name }) => name === "layout")?.defaultValue, '"intrinsic"');
  assert.equal(
    codeEditorProps?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    codeEditorProps?.find(({ name }) => name === "style"),
    undefined,
  );
});

test("extracts the constrained ButtonGroup named API", () => {

  assert.deepEqual(
    metadata["buttonGroup.root"]?.map(({ name }) => name),
    ["orientation", "render"],
  );
  assert.equal(
    metadata["buttonGroup.root"]?.find(({ name }) => name === "orientation")?.defaultValue,
    '"horizontal"',
  );
  assert.equal(
    metadata["buttonGroup.separator"]?.find(({ name }) => name === "orientation")?.defaultValue,
    '"vertical"',
  );
  assert.deepEqual(
    metadata["buttonGroup.text"]?.map(({ name }) => name),
    [],
  );
  assert.equal(
    metadata["buttonGroup.root"]?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    metadata["buttonGroup.separator"]?.find(({ name }) => name === "style"),
    undefined,
  );
});

test("extracts the constrained ToggleGroup compound API", () => {
  const rootProps = metadata["toggleGroup.root"];
  const itemProps = metadata["toggleGroup.item"];

  assert.deepEqual(
    rootProps?.map(({ name }) => name),
    [
      "value",
      "defaultValue",
      "onValueChange",
      "loopFocus",
      "multiple",
      "disabled",
      "orientation",
      "width",
      "itemWidth",
      "size",
    ],
  );
  assert.equal(rootProps?.find(({ name }) => name === "loopFocus")?.defaultValue, "true");
  assert.equal(rootProps?.find(({ name }) => name === "multiple")?.defaultValue, "false");
  assert.equal(rootProps?.find(({ name }) => name === "orientation")?.defaultValue, '"horizontal"');
  assert.equal(rootProps?.find(({ name }) => name === "size")?.defaultValue, '"l"');
  assert.deepEqual(
    itemProps?.map(({ name }) => name),
    ["value", "onPressedChange", "nativeButton", "disabled", "render"],
  );
  assert.equal(itemProps?.find(({ name }) => name === "nativeButton")?.defaultValue, "true");
  assert.equal(
    itemProps?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    itemProps?.find(({ name }) => name === "pressed"),
    undefined,
  );
});

test("extracts the constrained WorkspaceTabs compound API", () => {
  assert.deepEqual(
    metadata["workspaceTabs.root"]?.map(({ name }) => name),
    ["children", "value", "defaultValue", "onValueChange"],
  );
  assert.equal(
    metadata["workspaceTabs.tab"]?.find(({ name }) => name === "closeHotkey")?.type,
    "KeyboardInputHotkey",
  );
  assert.deepEqual(
    metadata["workspaceTabs.list"]?.map(({ name }) => name),
    [
      "children",
      "aria-label",
      "aria-labelledby",
      "activateOnFocus",
      "loopFocus",
      "values",
      "onReorder",
    ],
  );
  assert.deepEqual(
    metadata["workspaceTabs.tab"]?.map(({ name }) => name),
    [
      "value",
      "children",
      "prefix",
      "retention",
      "disabled",
      "onBlur",
      "onClose",
      "onFocus",
      "onDoubleClick",
      "onPointerDown",
      "onPointerEnter",
      "onPointerLeave",
      "closeLabel",
      "closeHotkey",
      "reorderLabel",
      "contextMenuItems",
      "contextMenuLabel",
    ],
  );
  assert.deepEqual(
    metadata["workspaceTabs.panel"]?.map(({ name }) => name),
    ["value", "children", "keepMounted"],
  );
  assert.equal(
    metadata["workspaceTabs.tab"]?.find(({ name }) => name === "closeLabel")?.defaultValue,
    '"Close tab"',
  );
  assert.equal(
    metadata["workspaceTabs.tab"]?.find(({ name }) => name === "retention")?.defaultValue,
    '"persistent"',
  );
  assert.equal(
    metadata["workspaceTabs.tab"]?.find(({ name }) => name === "className"),
    undefined,
  );
});

test("preserves the exported KeyboardInputHotkey alias in generated APIs", () => {
  assert.equal(
    metadata.keyboardInput?.find(({ name }) => name === "hotkey")?.type,
    "KeyboardInputHotkey",
  );
  assert.equal(
    metadata["menu.shortcut"]?.find(({ name }) => name === "hotkey")?.type,
    "KeyboardInputHotkey",
  );
  assert.equal(
    metadata["contextMenu.shortcut"]?.find(({ name }) => name === "hotkey")?.type,
    "KeyboardInputHotkey",
  );
  assert.equal(
    metadata["menu.shortcut"]?.find(({ name }) => name === "platform")?.defaultValue,
    '"auto"',
  );
  assert.equal(
    metadata["contextMenu.shortcut"]?.find(({ name }) => name === "platform")?.defaultValue,
    '"auto"',
  );
});

test("extracts Input API facts from the public package export", () => {
  const inputProps = metadata.input;

  assert.ok(inputProps);
  assert.deepEqual(
    inputProps.map(({ name }) => name),
    [
      "size",
      "variant",
      "font",
      "fullWidth",
      "invalid",
      "disabled",
      "readOnly",
      "defaultValue",
      "value",
      "onValueChange",
      "render",
    ],
  );
  assert.equal(inputProps.find(({ name }) => name === "size")?.defaultValue, '"l"');
  assert.equal(inputProps.find(({ name }) => name === "variant")?.defaultValue, '"default"');
  assert.equal(inputProps.find(({ name }) => name === "font")?.defaultValue, '"sans"');
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

test("extracts the constrained Textarea API", () => {

  assert.deepEqual(
    metadata.textarea?.map(({ name }) => name),
    [
      "height",
      "font",
      "fullWidth",
      "invalid",
      "disabled",
      "readOnly",
      "defaultValue",
      "value",
      "onValueChange",
    ],
  );
});

test("extracts the constrained InputGroup compound API", () => {

  assert.deepEqual(
    metadata["inputGroup.root"]?.map(({ name }) => name),
    ["children", "size", "fullWidth", "invalid", "disabled"],
  );
  assert.deepEqual(
    metadata["inputGroup.prefix"]?.map(({ name }) => name),
    ["children"],
  );
  assert.deepEqual(
    metadata["inputGroup.suffix"]?.map(({ name }) => name),
    ["children"],
  );
  assert.deepEqual(
    metadata["inputGroup.action"]?.map(({ name }) => name),
    ["label", "controls", "pressed", "disabled", "render", "children", "onClick"],
  );
  assert.deepEqual(
    metadata["inputGroup.checkbox"]?.map(({ name }) => name),
    [
      "label",
      "checked",
      "defaultChecked",
      "onCheckedChange",
      "disabled",
      "readOnly",
      "tooltip",
      "children",
    ],
  );
});

test("extracts compound Field part API facts from the public package export", () => {

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
    metadata["field.root"]?.find(({ name }) => name === "validationMode")?.defaultValue,
    undefined,
  );
  assert.equal(
    metadata["field.label"]?.find(({ name }) => name === "nativeLabel")?.defaultValue,
    "true",
  );
});

test("extracts compound Fieldset part API facts from the public package export", () => {

  assert.deepEqual(
    metadata["fieldset.root"]?.map(({ name }) => name),
    ["disabled"],
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

test("does not expose an unused Form abstraction", () => {

  assert.equal(metadata.form, undefined);
});

test("extracts Checkbox API facts from the public package export", () => {
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
  assert.equal(
    checkboxProps.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    checkboxProps.find(({ name }) => name === "style"),
    undefined,
  );

  const checkboxLabelProps = metadata["checkbox.label"];
  assert.ok(checkboxLabelProps);
  assert.deepEqual(
    checkboxLabelProps.map(({ name }) => name),
    ["layout"],
  );
  assert.equal(checkboxLabelProps[0]?.defaultValue, '"content"');
});

test("extracts TextField composition props from the public package export", () => {
  const textFieldProps = metadata.textField;

  assert.ok(textFieldProps);
  assert.ok(textFieldProps.some(({ name }) => name === "label"));
  assert.ok(textFieldProps.some(({ name }) => name === "description"));
  assert.ok(textFieldProps.some(({ name }) => name === "error"));
  assert.ok(textFieldProps.some(({ name }) => name === "invalid"));
  assert.ok(textFieldProps.some(({ name }) => name === "size"));
  assert.equal(textFieldProps.find(({ name }) => name === "fullWidth")?.defaultValue, "true");
  assert.equal(
    textFieldProps.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    textFieldProps.find(({ name }) => name === "style"),
    undefined,
  );
});

test("extracts the constrained FindBar API", () => {
  const findBarProps = metadata.findBar;

  assert.deepEqual(
    findBarProps?.map(({ name }) => name),
    [
      "autoFocus",
      "label",
      "value",
      "onValueChange",
      "state",
      "searchOptions",
      "onSearchOptionsChange",
      "onPreviousMatch",
      "onNextMatch",
      "onDismiss",
    ],
  );
  assert.equal(
    findBarProps?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    findBarProps?.find(({ name }) => name === "fullWidth"),
    undefined,
  );
});

test("extracts the constrained Menu compound API", () => {

  assert.equal(
    metadata["menu.root"]?.find(({ name }) => name === "defaultOpen")?.defaultValue,
    "false",
  );
  assert.equal(
    metadata["menu.trigger"]?.find(({ name }) => name === "disabled")?.defaultValue,
    "false",
  );
  assert.equal(
    metadata["menu.positioner"]?.find(({ name }) => name === "sideOffset"),
    undefined,
  );
  assert.deepEqual(
    metadata["menu.positioner"]?.map(({ name }) => name),
    ["side", "align"],
  );
  assert.equal(
    metadata["menu.positioner"]?.find(({ name }) => name === "side")?.defaultValue,
    '"bottom"',
  );
  assert.equal(
    metadata["menu.positioner"]?.find(({ name }) => name === "align")?.defaultValue,
    '"start"',
  );
  assert.equal(
    metadata["menu.popup"]?.find(({ name }) => name === "width")?.defaultValue,
    '"content"',
  );
  assert.match(
    metadata["menu.popup"]?.find(({ name }) => name === "width")?.type ?? "",
    /"content".*"anchor"/,
  );
  assert.equal(
    metadata["menu.item"]?.find(({ name }) => name === "closeOnClick")?.defaultValue,
    "true",
  );
  assert.equal(
    metadata["menu.item"]?.find(({ name }) => name === "variant")?.defaultValue,
    '"default"',
  );
  const menuItemVariant =
    metadata["menu.item"]?.find(({ name }) => name === "variant")?.type ?? "";
  assert.match(menuItemVariant, /"default"/);
  assert.match(menuItemVariant, /"danger"/);
  assert.equal(
    metadata["menu.item"]?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.ok(metadata["menu.group"]);
  assert.ok(metadata["menu.groupLabel"]);
  assert.equal(
    metadata["menu.groupLabel"]?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.deepEqual(
    metadata["menu.shortcut"]?.map(({ name }) => name),
    ["hotkey", "platform"],
  );
  assert.equal(
    metadata["menu.shortcut"]?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    metadata["menu.content"]?.find(({ name }) => name === "sideOffset"),
    undefined,
  );
  assert.equal(
    metadata["menu.linkItem"]?.find(({ name }) => name === "closeOnClick")?.defaultValue,
    "true",
  );
  assert.equal(
    metadata["menu.checkboxItem"]?.find(({ name }) => name === "closeOnClick")?.defaultValue,
    "false",
  );
  assert.equal(
    metadata["menu.radioItem"]?.find(({ name }) => name === "closeOnClick")?.defaultValue,
    "false",
  );
});

test("extracts the constrained ContextMenu compound API", () => {

  assert.equal(
    metadata["contextMenu.root"]?.find(({ name }) => name === "defaultOpen")?.defaultValue,
    "false",
  );
  assert.equal(
    metadata["contextMenu.content"]?.find(({ name }) => name === "sideOffset"),
    undefined,
  );
  assert.deepEqual(
    metadata["contextMenu.positioner"]?.map(({ name }) => name),
    ["side", "align"],
  );
  assert.equal(
    metadata["contextMenu.positioner"]?.find(({ name }) => name === "side")?.defaultValue,
    '"bottom"',
  );
  assert.equal(
    metadata["contextMenu.positioner"]?.find(({ name }) => name === "align")?.defaultValue,
    '"start"',
  );
  assert.equal(
    metadata["contextMenu.item"]?.find(({ name }) => name === "variant")?.defaultValue,
    '"default"',
  );
  assert.equal(
    metadata["contextMenu.item"]?.find(({ name }) => name === "closeOnClick")?.defaultValue,
    "true",
  );
  assert.equal(
    metadata["contextMenu.linkItem"]?.find(({ name }) => name === "closeOnClick")?.defaultValue,
    "true",
  );
  assert.equal(
    metadata["contextMenu.checkboxItem"]?.find(({ name }) => name === "closeOnClick")?.defaultValue,
    "false",
  );
  assert.equal(
    metadata["contextMenu.radioItem"]?.find(({ name }) => name === "closeOnClick")?.defaultValue,
    "false",
  );
  assert.equal(
    metadata["contextMenu.item"]?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.deepEqual(
    metadata["contextMenu.shortcut"]?.map(({ name }) => name),
    ["hotkey", "platform"],
  );
});

test("extracts the constrained Combobox compound API", () => {

  assert.equal(
    metadata["combobox.root"]?.find(({ name }) => name === "disabled")?.defaultValue,
    "false",
  );
  assert.equal(
    metadata["combobox.root"]?.find(({ name }) => name === "defaultOpen")?.defaultValue,
    "false",
  );
  assert.equal(metadata["combobox.trigger"]?.find(({ name }) => name === "variant"), undefined);
  assert.equal(
    metadata["combobox.inputTrigger"]?.find(({ name }) => name === "disabled")?.defaultValue,
    "false",
  );
  assert.equal(
    metadata["combobox.input"]?.find(({ name }) => name === "size"),
    undefined,
  );
  assert.equal(
    metadata["combobox.inputGroup"]?.find(({ name }) => name === "appearance")?.defaultValue,
    '"default"',
  );
  assert.equal(
    metadata["combobox.inputGroup"]?.find(({ name }) => name === "width")?.defaultValue,
    '"content"',
  );
  assert.equal(
    metadata["combobox.content"]?.find(({ name }) => name === "width")?.defaultValue,
    '"anchor"',
  );
  assert.equal(
    metadata["combobox.clear"]?.find(({ name }) => name === "label")?.defaultValue,
    '"Clear selection"',
  );
  assert.ok(metadata["combobox.status"]);
  assert.equal(
    metadata["combobox.popup"]?.find(({ name }) => name === "width")?.defaultValue,
    '"anchor"',
  );
  const comboboxPopupWidth =
    metadata["combobox.popup"]?.find(({ name }) => name === "width")?.type ?? "";
  assert.match(comboboxPopupWidth, /"anchor"/);
  assert.match(comboboxPopupWidth, /"content"/);
  assert.equal(
    metadata["combobox.viewport"]?.find(({ name }) => name === "maxHeight")?.defaultValue,
    '"m"',
  );
  assert.equal(
    metadata["combobox.positioner"]?.find(({ name }) => name === "sideOffset"),
    undefined,
  );
  assert.equal(
    metadata["combobox.positioner"]?.find(({ name }) => name === "side")?.defaultValue,
    '"bottom"',
  );
  assert.equal(
    metadata["combobox.positioner"]?.find(({ name }) => name === "align")?.defaultValue,
    '"start"',
  );
  assert.deepEqual(
    metadata["combobox.item"]?.map(({ name }) => name),
    ["value", "indicator", "render"],
  );
  assert.equal(
    metadata["combobox.item"]?.find(({ name }) => name === "indicator")?.defaultValue,
    '"check"',
  );
  assert.deepEqual(
    metadata["combobox.itemText"]?.map(({ name }) => name),
    ["label", "description"],
  );
  assert.ok(metadata["combobox.label"]);
  assert.ok(metadata["combobox.value"]);
  assert.ok(metadata["combobox.popupHeader"]);
  assert.ok(metadata["combobox.popupFooter"]);
  assert.ok(metadata["combobox.separator"]);
  assert.equal(
    metadata["combobox.input"]?.find(({ name }) => name === "style"),
    undefined,
  );
});

test("extracts the constrained ContextSwitcher compound API", () => {

  assert.deepEqual(
    metadata["contextSwitcher.root"]?.map(({ name }) => name),
    [
      "items",
      "value",
      "defaultValue",
      "onValueChange",
      "defaultOpen",
      "open",
      "onOpenChange",
      "itemToStringLabel",
      "itemToStringValue",
      "isItemEqualToValue",
      "filter",
      "disabled",
    ],
  );
  assert.equal(
    metadata["contextSwitcher.root"]?.find(({ name }) => name === "defaultOpen")?.defaultValue,
    "false",
  );
  assert.deepEqual(
    metadata["contextSwitcher.trigger"]?.map(({ name }) => name),
    ["label", "size", "width", "disabled", "tooltip"],
  );
  assert.equal(
    metadata["contextSwitcher.trigger"]?.find(({ name }) => name === "size")?.defaultValue,
    '"m"',
  );
  assert.equal(
    metadata["contextSwitcher.trigger"]?.find(({ name }) => name === "width")?.defaultValue,
    '"content"',
  );
  assert.equal(
    metadata["contextSwitcher.content"]?.find(({ name }) => name === "width")?.defaultValue,
    '"m"',
  );
  assert.deepEqual(
    metadata["contextSwitcher.search"]?.map(({ name }) => name),
    ["label", "placeholder"],
  );
  assert.equal(
    metadata["contextSwitcher.viewport"]?.find(({ name }) => name === "maxHeight")?.defaultValue,
    '"m"',
  );
  assert.equal(
    metadata["contextSwitcher.item"]?.find(({ name }) => name === "indicator")?.defaultValue,
    '"check"',
  );
  assert.equal(
    metadata["contextSwitcher.trigger"]?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    metadata["contextSwitcher.content"]?.find(({ name }) => name === "style"),
    undefined,
  );
});

test("extracts the constrained MultiSelect compound API", () => {

  assert.deepEqual(
    metadata["multiSelect.root"]?.map(({ name }) => name),
    [
      "items",
      "value",
      "defaultValue",
      "onValueChange",
      "defaultOpen",
      "open",
      "onOpenChange",
      "disabled",
    ],
  );
  assert.equal(
    metadata["multiSelect.root"]?.find(({ name }) => name === "items")?.type,
    "readonly MultiSelectItem[]",
  );
  assert.equal(
    metadata["multiSelect.root"]?.find(({ name }) => name === "defaultOpen")?.defaultValue,
    "false",
  );
  assert.deepEqual(
    metadata["multiSelect.trigger"]?.map(({ name }) => name),
    ["label", "render", "disabled"],
  );
  assert.deepEqual(
    metadata["multiSelect.content"]?.map(({ name }) => name),
    ["label", "width", "maxHeight", "keepMounted", "align"],
  );
  assert.equal(
    metadata["multiSelect.content"]?.find(({ name }) => name === "width")?.defaultValue,
    '"m"',
  );
  assert.equal(
    metadata["multiSelect.content"]?.find(({ name }) => name === "maxHeight")?.defaultValue,
    '"m"',
  );
  assert.equal(
    metadata["multiSelect.trigger"]?.find(({ name }) => name === "className"),
    undefined,
  );
  assert.equal(
    metadata["multiSelect.content"]?.find(({ name }) => name === "style"),
    undefined,
  );
});

test("extracts the constrained Checkbox Group compound API", () => {
  assert.deepEqual(
    metadata["checkboxGroup.root"]?.map(({ name }) => name),
    ["items", "value", "defaultValue", "onValueChange", "disabled"],
  );
  assert.equal(
    metadata["checkboxGroup.root"]?.find(({ name }) => name === "defaultValue")?.defaultValue,
    "[]",
  );
  assert.equal(
    metadata["checkboxGroup.root"]?.find(({ name }) => name === "disabled")?.defaultValue,
    "false",
  );
  assert.deepEqual(
    metadata["checkboxGroup.list"]?.map(({ name }) => name),
    ["label", "rendering"],
  );
  assert.equal(
    metadata["checkboxGroup.list"]?.find(({ name }) => name === "rendering")?.defaultValue,
    '"eager"',
  );
  assert.equal(
    metadata["checkboxGroup.list"]?.find(({ name }) => name === "className"),
    undefined,
  );
});

test("extracts the constrained Select compound API", () => {

  assert.equal(
    metadata["select.root"]?.find(({ name }) => name === "disabled")?.defaultValue,
    "false",
  );
  assert.equal(
    metadata["select.trigger"]?.find(({ name }) => name === "size")?.defaultValue,
    '"l"',
  );
  assert.ok(metadata["select.trigger"]?.some(({ name }) => name === "placeholder"));
  assert.equal(metadata["select.positioner"], undefined);
  assert.equal(metadata["select.itemIndicator"], undefined);
  assert.equal(metadata["select.item"]?.find(({ name }) => name === "size"), undefined);
  assert.equal(
    metadata["select.trigger"]?.find(({ name }) => name === "className"),
    undefined,
  );
});

test("extracts standalone Calendar and compound DatePicker APIs", () => {
  assert.deepEqual(
    metadata.calendar?.map(({ name }) => name),
    [
      "value",
      "defaultValue",
      "onValueChange",
      "minValue",
      "maxValue",
      "disabled",
      "autoFocus",
    ],
  );
  assert.deepEqual(
    metadata["datePicker.root"]?.map(({ name }) => name),
    [
      "value",
      "onApply",
      "open",
      "defaultOpen",
      "onOpenChange",
      "minValue",
      "maxValue",
      "disabled",
    ],
  );
  assert.deepEqual(
    metadata["datePicker.content"]?.map(({ name }) => name),
    ["align", "autoFocus", "keepMounted"],
  );
  assert.deepEqual(
    metadata["datePicker.panel"]?.map(({ name }) => name),
    ["autoFocus"],
  );
});

test("extracts the value presentation component APIs", () => {

  assert.deepEqual(
    metadata.binaryValue?.map(({ name }) => name),
    ["byteLength"],
  );
  assert.deepEqual(
    metadata.binaryDetails?.map(({ name }) => name),
    ["byteLength", "onCopy", "onDownload"],
  );

  assert.deepEqual(
    metadata.timestampValue?.map(({ name }) => name),
    ["value"],
  );
  assert.equal(metadata.timestampDetails, undefined);

  assert.deepEqual(
    metadata.structuredValuePreview?.map(({ name }) => name),
    ["model", "variant"],
  );
  assert.equal(
    metadata.structuredValuePreview?.find(({ name }) => name === "variant")?.defaultValue,
    '"json"',
  );

  assert.deepEqual(
    metadata.relationValue?.map(({ name }) => name),
    ["id", "navigation"],
  );
  assert.deepEqual(
    metadata.relationDetails?.map(({ name }) => name),
    ["id", "navigation", "state"],
  );
  assert.match(
    metadata.relationDetails?.find(({ name }) => name === "navigation")?.type ?? "",
    /href.*render.*ReactElement/,
  );
});

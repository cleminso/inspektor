import { readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { Node, Project, ts } from "ts-morph";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, "../../..");
const packageRoot = resolve(workspaceRoot, "packages/design-system");
const packageSourceRoot = resolve(packageRoot, "src");
const packageEntryPath = resolve(packageSourceRoot, "index.ts");
const outputPath = resolve(scriptDirectory, "../src/generated/props.json");

const componentEntries = [
  {
    componentId: "checkbox",
    exportName: "Checkbox",
    part: "Root",
    inheritedProps: [],
  },
  {
    componentId: "checkbox.label",
    exportName: "Checkbox",
    part: "Label",
    inheritedProps: [],
  },
  {
    componentId: "switch",
    exportName: "Switch",
    inheritedProps: [],
  },
  {
    componentId: "button",
    exportName: "Button",
    inheritedProps: [],
  },
  {
    componentId: "button.glyph",
    exportName: "Button",
    part: "Glyph",
    inheritedProps: [],
  },
  {
    componentId: "buttonLink",
    exportName: "ButtonLink",
    inheritedProps: [],
  },
  {
    componentId: "textLink",
    exportName: "TextLink",
    inheritedProps: [],
  },
  {
    componentId: "copyButton",
    exportName: "CopyButton",
    inheritedProps: [],
  },
  {
    componentId: "box",
    exportName: "Box",
    inheritedProps: [],
  },
  {
    componentId: "scrollArea",
    exportName: "ScrollArea",
    inheritedProps: ["aria-label", "children"],
  },
  {
    componentId: "resizablePanelGroup",
    exportName: "ResizablePanelGroup",
    inheritedProps: [],
  },
  {
    componentId: "resizablePanel",
    exportName: "ResizablePanel",
    inheritedProps: [],
  },
  {
    componentId: "resizableHandle",
    exportName: "ResizableHandle",
    inheritedProps: [],
  },
  {
    componentId: "buttonGroup.root",
    exportName: "ButtonGroup",
    inheritedProps: [],
  },
  {
    componentId: "buttonGroup.separator",
    exportName: "ButtonGroupSeparator",
    inheritedProps: [],
  },
  {
    componentId: "buttonGroup.text",
    exportName: "ButtonGroupText",
    inheritedProps: [],
  },
  ...["Root", "Item"].map((part) => ({
    componentId: `toggleGroup.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "ToggleGroup",
    part,
    inheritedProps: [],
  })),
  ...["Root", "Bar", "LeadingArea", "List", "Tab", "TrailingArea", "Panel"].map((part) => ({
    componentId: `workspaceTabs.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "WorkspaceTabs",
    part,
    inheritedProps: [],
  })),
  ...["Root", "Item", "Header", "Trigger", "Panel"].map((part) => ({
    componentId: `accordion.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "Accordion",
    part,
    inheritedProps: [],
  })),
  ...["Root", "Content", "Title", "Description", "Actions", "Close"].map((part) => ({
    componentId: `alertDialog.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "AlertDialog",
    part,
    inheritedProps: [],
  })),
  ...["Root", "Item", "SelectionControl", "Trigger", "Action"].map((part) => ({
    componentId: `actionList.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "ActionList",
    part,
    inheritedProps:
      part === "Root" ? ["children", "aria-label", "aria-labelledby"] : [],
  })),
  ...["Root", "Header", "Body", "Footer"].map((part) => ({
    componentId: `sidePanel.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "SidePanel",
    part,
    inheritedProps: ["children"],
  })),
  ...["Root", "Content", "Details", "Summary", "Actions"].map((part) => ({
    componentId: `floatingPanel.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "FloatingPanel",
    part,
    inheritedProps:
      part === "Root"
        ? ["aria-label", "aria-labelledby", "children"]
        : ["children"],
  })),
  ...[
    "Root",
    "Viewport",
    "Table",
    "Content",
    "Header",
    "HeaderRow",
    "HeaderCell",
    "Body",
    "Row",
    "Cell",
    "ExpandedRow",
    "Empty",
    "Loading",
    "Footer",
  ].map((part) => ({
    componentId: `dataGrid.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "DataGrid",
    part,
    inheritedProps: [],
  })),
  ...["Provider", "Root", "Trigger", "Content"].map((part) => ({
    componentId: `tooltip.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "Tooltip",
    part,
    inheritedProps: [],
  })),
  {
    componentId: "toaster",
    exportName: "Toaster",
    inheritedProps: [],
  },
  {
    componentId: "spinner",
    exportName: "Spinner",
    inheritedProps: [],
  },
  {
    componentId: "icon",
    exportName: "Icon",
    inheritedProps: [],
  },
  {
    componentId: "jsonView",
    exportName: "JsonView",
    inheritedProps: [],
  },
  {
    componentId: "codeEditor",
    exportName: "CodeEditor",
    inheritedProps: [],
  },
  {
    componentId: "binaryValue",
    exportName: "BinaryValue",
    inheritedProps: [],
  },
  {
    componentId: "binaryDetails",
    exportName: "BinaryDetails",
    inheritedProps: [],
  },
  {
    componentId: "timestampValue",
    exportName: "TimestampValue",
    inheritedProps: [],
  },
  {
    componentId: "structuredValuePreview",
    exportName: "StructuredValuePreview",
    inheritedProps: [],
  },
  {
    componentId: "middleTruncate",
    exportName: "MiddleTruncate",
    inheritedProps: [],
  },
  {
    componentId: "relationValue",
    exportName: "RelationValue",
    inheritedProps: [],
  },
  {
    componentId: "relationDetails",
    exportName: "RelationDetails",
    inheritedProps: [],
  },
  {
    componentId: "input",
    exportName: "Input",
    inheritedProps: [],
  },
  {
    componentId: "textarea",
    exportName: "Textarea",
    inheritedProps: [],
  },
  ...["Root", "Prefix", "Suffix", "Action", "Checkbox"].map((part) => ({
    componentId: `inputGroup.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "InputGroup",
    part,
    inheritedProps: part === "Action" ? ["onClick"] : [],
  })),
  {
    componentId: "keyboardInput",
    exportName: "KeyboardInput",
    inheritedProps: [],
  },
  {
    componentId: "field.root",
    exportName: "Field",
    part: "Root",
    inheritedProps: [],
  },
  {
    componentId: "field.label",
    exportName: "Field",
    part: "Label",
    inheritedProps: [],
  },
  {
    componentId: "field.description",
    exportName: "Field",
    part: "Description",
    inheritedProps: [],
  },
  {
    componentId: "field.error",
    exportName: "Field",
    part: "Error",
    inheritedProps: [],
  },
  {
    componentId: "fieldset.root",
    exportName: "Fieldset",
    part: "Root",
    inheritedProps: [],
  },
  {
    componentId: "fieldset.legend",
    exportName: "Fieldset",
    part: "Legend",
    inheritedProps: [],
  },
  {
    componentId: "textField",
    exportName: "TextField",
    inheritedProps: [],
  },
  {
    componentId: "findBar",
    exportName: "FindBar",
    inheritedProps: [],
  },
  ...[
    "Root",
    "Trigger",
    "Portal",
    "Positioner",
    "Popup",
    "Content",
    "Item",
    "LinkItem",
    "Group",
    "GroupLabel",
    "Shortcut",
    "Separator",
    "CheckboxItem",
    "CheckboxItemIndicator",
    "RadioGroup",
    "RadioItem",
    "RadioItemIndicator",
    "SubmenuRoot",
    "SubmenuTrigger",
    "Prefix",
    "Suffix",
  ].map((part) => ({
    componentId: `menu.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "Menu",
    part,
    inheritedProps: part === "Positioner" ? ["side", "align"] : [],
  })),
  ...[
    "Root",
    "Trigger",
    "Portal",
    "Positioner",
    "Popup",
    "Content",
    "Item",
    "LinkItem",
    "Group",
    "GroupLabel",
    "Shortcut",
    "Separator",
    "CheckboxItem",
    "CheckboxItemIndicator",
    "RadioGroup",
    "RadioItem",
    "RadioItemIndicator",
    "SubmenuRoot",
    "SubmenuTrigger",
    "Prefix",
    "Suffix",
  ].map((part) => ({
    componentId: `contextMenu.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "ContextMenu",
    part,
    inheritedProps: part === "Positioner" ? ["side", "align"] : [],
  })),
  ...[
    "Root",
    "Label",
    "Value",
    "InputGroup",
    "Input",
    "Trigger",
    "InputTrigger",
    "Portal",
    "Positioner",
    "Popup",
    "Content",
    "PopupHeader",
    "PopupFooter",
    "Viewport",
    "Clear",
    "Separator",
    "Empty",
    "Status",
    "List",
    "Group",
    "GroupLabel",
    "Item",
    "ItemText",
    "ItemIndicator",
  ].map((part) => ({
    componentId: `combobox.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "Combobox",
    part,
    inheritedProps: part === "Positioner" ? ["side", "align"] : [],
  })),
  ...[
    "Root",
    "Trigger",
    "Value",
    "Search",
    "Content",
    "Viewport",
    "Empty",
    "Status",
    "List",
    "Item",
    "ItemText",
    "Footer",
  ].map((part) => ({
    componentId: `contextSwitcher.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "ContextSwitcher",
    part,
    inheritedProps: [],
  })),
  ...["Root", "Trigger", "Content"].map((part) => ({
    componentId: `multiSelect.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "MultiSelect",
    part,
    inheritedProps: [],
  })),
  ...["Root", "Trigger", "Content"].map((part) => ({
    componentId: `calendar.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "Calendar",
    part,
    inheritedProps: [],
  })),
  ...[
    "Root",
    "Label",
    "Trigger",
    "Content",
    "Item",
  ].map((part) => ({
    componentId: `select.${part[0].toLowerCase()}${part.slice(1)}`,
    exportName: "Select",
    part,
    inheritedProps: [],
  })),
];

function isPackageDeclaration(declaration) {
  const sourcePath = declaration.getSourceFile().getFilePath();
  return sourcePath === packageSourceRoot || sourcePath.startsWith(`${packageSourceRoot}${sep}`);
}

function getDescription(symbol, typeChecker) {
  return ts.displayPartsToString(
    symbol.compilerSymbol.getDocumentationComment(typeChecker.compilerObject),
  );
}

function getDeprecation(symbol, typeChecker) {
  const deprecatedTag = symbol.compilerSymbol
    .getJsDocTags(typeChecker.compilerObject)
    .find(({ name }) => name === "deprecated");

  if (deprecatedTag === undefined) {
    return undefined;
  }

  return deprecatedTag.text?.map(({ text }) => text).join("") ?? "Deprecated.";
}

function formatType(type, location) {
  const unionTypes = type.getUnionTypes();
  const definedUnionTypes = unionTypes.filter((unionType) => unionType.isUndefined() === false);
  if (definedUnionTypes.length > 0 && definedUnionTypes.length !== unionTypes.length) {
    return definedUnionTypes.map((unionType) => formatType(unionType, location)).join(" | ");
  }

  const normalizedType = type;
  if (normalizedType.isTypeParameter()) {
    const constraint = normalizedType.getConstraint();
    if (constraint !== undefined) {
      return formatType(constraint, location);
    }
  }
  const aliasDeclaration = normalizedType
    .getAliasSymbol()
    ?.getDeclarations()
    .find(Node.isTypeAliasDeclaration);
  const aliasTypeNode = aliasDeclaration?.getTypeNode();

  if (
    aliasTypeNode !== undefined &&
    Node.isUnionTypeNode(aliasTypeNode) &&
    aliasDeclaration?.getTypeParameters().length === 0
  ) {
    return aliasTypeNode
      .getTypeNodes()
      .map((typeNode) => {
        if (Node.isLiteralTypeNode(typeNode)) {
          const literal = typeNode.getLiteral();
          if (Node.isStringLiteral(literal)) {
            return JSON.stringify(literal.getLiteralValue());
          }
        }

        return typeNode.getText();
      })
      .join(" | ");
  }

  const normalizedUnionTypes = normalizedType.getUnionTypes();

  if (
    normalizedUnionTypes.length > 0 &&
    normalizedUnionTypes.every((unionType) => unionType.isStringLiteral())
  ) {
    return normalizedUnionTypes
      .map((unionType) => JSON.stringify(unionType.getLiteralValue()))
      .join(" | ");
  }

  return normalizedType.getText(
    location,
    ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
  );
}

function formatDefault(initializer) {
  if (Node.isStringLiteral(initializer) || Node.isNoSubstitutionTemplateLiteral(initializer)) {
    return JSON.stringify(initializer.getLiteralValue());
  }

  return initializer.getText();
}

function getRuntimeDefaults(componentDeclaration) {
  const propsParameter = componentDeclaration.getParameters()[0];
  const nameNode = propsParameter?.getNameNode();

  if (nameNode === undefined || Node.isObjectBindingPattern(nameNode) === false) {
    return new Map();
  }

  return new Map(
    nameNode.getElements().flatMap((element) => {
      const initializer = element.getInitializer();
      if (initializer === undefined) {
        return [];
      }

      return [[element.getName(), formatDefault(initializer)]];
    }),
  );
}

function unwrapExpression(expression) {
  let current = expression;

  while (
    Node.isAsExpression(current) ||
    Node.isParenthesizedExpression(current) ||
    Node.isSatisfiesExpression(current)
  ) {
    current = current.getExpression();
  }

  return current;
}

function resolveForwardRefFunction(variableDeclaration) {
  const initializer = variableDeclaration.getInitializer();
  if (initializer === undefined) {
    return undefined;
  }

  const unwrappedInitializer = unwrapExpression(initializer);
  if (Node.isCallExpression(unwrappedInitializer) === false) {
    return undefined;
  }

  const expressionText = unwrappedInitializer.getExpression().getText();
  if (expressionText !== "forwardRef" && expressionText.endsWith(".forwardRef") === false) {
    return undefined;
  }

  const renderFunction = unwrappedInitializer.getArguments()[0];
  if (renderFunction === undefined) {
    return undefined;
  }

  if (Node.isFunctionExpression(renderFunction) || Node.isArrowFunction(renderFunction)) {
    return renderFunction;
  }

  return Node.isIdentifier(renderFunction)
    ? variableDeclaration.getSourceFile().getFunction(renderFunction.getText())
    : undefined;
}

function resolveNamedComponent(sourceFile, name) {
  const functionDeclaration = sourceFile.getFunction(name);
  if (functionDeclaration !== undefined) {
    return functionDeclaration;
  }

  const variableDeclaration = sourceFile.getVariableDeclaration(name);
  if (variableDeclaration !== undefined) {
    return resolveForwardRefFunction(variableDeclaration);
  }

  const importedDeclaration = sourceFile
    .getImportDeclarations()
    .flatMap((declaration) => declaration.getNamedImports())
    .find((specifier) => (specifier.getAliasNode()?.getText() ?? specifier.getName()) === name)
    ?.getNameNode()
    .getSymbol()
    ?.getAliasedSymbol()
    ?.getDeclarations()
    .find((declaration) => Node.isFunctionDeclaration(declaration) || Node.isVariableDeclaration(declaration));

  if (importedDeclaration === undefined) {
    return undefined;
  }

  return Node.isFunctionDeclaration(importedDeclaration)
    ? importedDeclaration
    : resolveForwardRefFunction(importedDeclaration);
}

function resolveAssignedFunction(variableDeclaration, part) {
  const initializer = variableDeclaration.getInitializer();
  if (initializer === undefined || Node.isCallExpression(initializer) === false) {
    return undefined;
  }

  const expression = initializer.getExpression();
  if (
    Node.isPropertyAccessExpression(expression) === false ||
    expression.getText() !== "Object.assign"
  ) {
    return undefined;
  }

  const [rootArgument, partsArgument] = initializer.getArguments();
  let functionName;

  if (part === undefined) {
    functionName = Node.isIdentifier(rootArgument) ? rootArgument.getText() : undefined;
  } else if (partsArgument !== undefined && Node.isObjectLiteralExpression(partsArgument)) {
    const property = partsArgument.getProperty(part);
    if (property !== undefined && Node.isPropertyAssignment(property)) {
      const propertyInitializer = property.getInitializer();
      functionName = Node.isIdentifier(propertyInitializer)
        ? propertyInitializer.getText()
        : undefined;
    }
  }

  return functionName === undefined
    ? undefined
    : resolveNamedComponent(variableDeclaration.getSourceFile(), functionName);
}

function resolveComponentDeclaration(declarations, entry) {
  const functionDeclaration = declarations?.find(Node.isFunctionDeclaration);
  if (functionDeclaration !== undefined && entry.part === undefined) {
    return functionDeclaration;
  }

  const variableDeclaration = declarations?.find(Node.isVariableDeclaration);
  if (variableDeclaration === undefined) {
    return undefined;
  }

  if (entry.part === undefined) {
    return (
      resolveForwardRefFunction(variableDeclaration) ??
      resolveAssignedFunction(variableDeclaration, entry.part)
    );
  }

  return resolveAssignedFunction(variableDeclaration, entry.part);
}

function extractComponentProps(project, entry) {
  const packageEntry = project.getSourceFileOrThrow(packageEntryPath);
  const declarations = packageEntry.getExportedDeclarations().get(entry.exportName);
  const componentDeclaration = resolveComponentDeclaration(declarations, entry);

  if (componentDeclaration === undefined) {
    throw new Error(`Public component export ${entry.exportName} was not found.`);
  }

  const signature = componentDeclaration.getType().getCallSignatures()[0];
  const propsSymbol = signature?.getParameters()[0];

  if (signature === undefined || propsSymbol === undefined) {
    throw new Error(`Public component export ${entry.exportName} has no props parameter.`);
  }

  const typeChecker = project.getTypeChecker();
  const propsType = propsSymbol.getTypeAtLocation(componentDeclaration);
  const runtimeDefaults = getRuntimeDefaults(componentDeclaration);
  const inheritedProps = new Set(entry.inheritedProps);

  return propsType
    .getApparentProperties()
    .flatMap((symbol) => {
      const declarationsForProp = symbol.getDeclarations();
      const packageDeclaration = declarationsForProp.find(isPackageDeclaration);
      const isInheritedProp = inheritedProps.has(symbol.getName());

      if (packageDeclaration === undefined && isInheritedProp === false) {
        return [];
      }

      const declaration = packageDeclaration ?? declarationsForProp[0];
      if (declaration === undefined) {
        return [];
      }

      const sourcePath = relative(workspaceRoot, declaration.getSourceFile().getFilePath());
      const deprecated = getDeprecation(symbol, typeChecker);

      return [
        {
          name: symbol.getName(),
          type: formatType(symbol.getTypeAtLocation(componentDeclaration), componentDeclaration),
          required: symbol.isOptional() === false,
          ...(runtimeDefaults.has(symbol.getName())
            ? { defaultValue: runtimeDefaults.get(symbol.getName()) }
            : {}),
          description: getDescription(symbol, typeChecker),
          ...(deprecated === undefined ? {} : { deprecated }),
          source: {
            path: sourcePath,
            line: declaration.getStartLineNumber(),
          },
        },
      ];
    })
    .sort((left, right) => {
      const leftInheritedIndex = entry.inheritedProps.indexOf(left.name);
      const rightInheritedIndex = entry.inheritedProps.indexOf(right.name);
      const leftIsInherited = leftInheritedIndex !== -1;
      const rightIsInherited = rightInheritedIndex !== -1;

      if (leftIsInherited !== rightIsInherited) {
        return leftIsInherited ? 1 : -1;
      }

      if (leftIsInherited && rightIsInherited) {
        return leftInheritedIndex - rightInheritedIndex;
      }

      return left.source.line - right.source.line;
    });
}

export function extractPropsMetadata() {
  const project = new Project({
    tsConfigFilePath: resolve(packageRoot, "tsconfig.json"),
  });

  return Object.fromEntries(
    componentEntries.map((entry) => [entry.componentId, extractComponentProps(project, entry)]),
  );
}

export function serializePropsMetadata(metadata) {
  return `${JSON.stringify(metadata, null, 2)}\n`;
}

async function run() {
  const nextContent = serializePropsMetadata(extractPropsMetadata());

  if (process.argv.includes("--check")) {
    const currentContent = await readFile(outputPath, "utf8").catch(() => "");
    if (currentContent !== nextContent) {
      throw new Error("Generated props are stale. Run pnpm gen:props.");
    }
    return;
  }

  await writeFile(outputPath, nextContent);
}

const entryPath = process.argv[1] === undefined ? undefined : resolve(process.argv[1]);
if (entryPath === fileURLToPath(import.meta.url)) {
  await run();
}

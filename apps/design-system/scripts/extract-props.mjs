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
    componentId: "copyButton",
    exportName: "CopyButton",
    inheritedProps: [],
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
    inheritedProps: [],
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
    componentId: "search",
    exportName: "Search",
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
    inheritedProps: [],
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
    inheritedProps: [],
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
    inheritedProps: [],
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
  ...[
    "Root",
    "Label",
    "Trigger",
    "Value",
    "Icon",
    "Portal",
    "Positioner",
    "Popup",
    "List",
    "Content",
    "Group",
    "GroupLabel",
    "Separator",
    "Item",
    "ItemText",
    "ItemIndicator",
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
  const normalizedType = type.getNonNullableType();
  const aliasDeclaration = normalizedType
    .getAliasSymbol()
    ?.getDeclarations()
    .find(Node.isTypeAliasDeclaration);
  const aliasTypeNode = aliasDeclaration?.getTypeNode();

  if (aliasTypeNode !== undefined && Node.isUnionTypeNode(aliasTypeNode)) {
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

  const unionTypes = normalizedType.getUnionTypes();

  if (unionTypes.length > 0 && unionTypes.every((unionType) => unionType.isStringLiteral())) {
    return unionTypes.map((unionType) => JSON.stringify(unionType.getLiteralValue())).join(" | ");
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
    : variableDeclaration.getSourceFile().getFunction(functionName);
}

function resolveComponentDeclaration(declarations, entry) {
  const functionDeclaration = declarations?.find(Node.isFunctionDeclaration);
  if (functionDeclaration !== undefined && entry.part === undefined) {
    return functionDeclaration;
  }

  const variableDeclaration = declarations?.find(Node.isVariableDeclaration);
  return variableDeclaration === undefined
    ? undefined
    : resolveAssignedFunction(variableDeclaration, entry.part);
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

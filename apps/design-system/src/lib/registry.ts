export interface SourceReference {
  label: string;
  path: string;
}

export interface NavItem {
  title: string;
  slug: string;
  href: string;
  description: string;
  importPath?: string;
  source: SourceReference;
  componentId?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const colorsFoundationItem = {
  title: "Colors",
  slug: "colors",
  href: "/foundations/colors",
  description: "Learn how to work with our color system. Click to copy raw values.",
  importPath: "@inspector/ds/theme",
  source: {
    label: "value.stylex.ts",
    path: "packages/design-system/src/tokens/value.stylex.ts",
  },
} satisfies NavItem;

export const typographyFoundationItem = {
  title: "Typography",
  slug: "typography",
  href: "/foundations/typography",
  description: "Text scale, tone, and hierarchy for inspector surfaces.",
  importPath: "@inspector/ds/theme",
  source: {
    label: "semantics.stylex.ts",
    path: "packages/design-system/src/tokens/semantics.stylex.ts",
  },
} satisfies NavItem;

export const foundationItems: NavItem[] = [colorsFoundationItem, typographyFoundationItem];

export const buttonItem = {
  title: "Button",
  slug: "button",
  href: "/components/button",
  description: "Action primitive with variants, sizes, loading, and composition support.",
  importPath: "@inspector/ds",
  source: {
    label: "button.tsx",
    path: "packages/design-system/src/components/button/button.tsx",
  },
  componentId: "button",
} satisfies NavItem;

export const buttonLinkItem = {
  title: "Button Link",
  slug: "button-link",
  href: "/components/button-link",
  description: "Navigation with Button presentation and native link semantics.",
  importPath: "@inspector/ds",
  source: {
    label: "buttonLink.tsx",
    path: "packages/design-system/src/components/buttonLink/buttonLink.tsx",
  },
  componentId: "buttonLink",
} satisfies NavItem;

export const textLinkItem = {
  title: "Text Link",
  slug: "text-link",
  href: "/components/text-link",
  description: "Inline navigation with native anchor semantics and router composition.",
  importPath: "@inspector/ds",
  source: {
    label: "textLink.tsx",
    path: "packages/design-system/src/components/textLink/textLink.tsx",
  },
  componentId: "textLink",
} satisfies NavItem;

export const buttonGroupItem = {
  title: "Button Group",
  slug: "button-group",
  href: "/components/button-group",
  description: "A container for related actions, controls, and separators.",
  importPath: "@inspector/ds",
  source: {
    label: "buttonGroup.tsx",
    path: "packages/design-system/src/components/buttonGroup/buttonGroup.tsx",
  },
  componentId: "buttonGroup",
} satisfies NavItem;

export const copyButtonItem = {
  title: "Copy Button",
  slug: "copy-button",
  href: "/components/copy-button",
  description: "An icon action that copies text and reports success or failure.",
  importPath: "@inspector/ds",
  source: {
    label: "copyButton.tsx",
    path: "packages/design-system/src/components/copyButton/copyButton.tsx",
  },
  componentId: "copyButton",
} satisfies NavItem;

export const toggleGroupItem = {
  title: "Toggle Group",
  slug: "toggle-group",
  href: "/components/toggle-group",
  description: "A single- or multiple-selection group of related toggle buttons.",
  importPath: "@inspector/ds",
  source: {
    label: "toggleGroup.tsx",
    path: "packages/design-system/src/components/toggleGroup/toggleGroup.tsx",
  },
  componentId: "toggleGroup",
} satisfies NavItem;

export const tabViewItem = {
  title: "Tab View",
  slug: "tab-view",
  href: "/components/tab-view",
  description: "Closable tabs for switching between captured representations of the same resource.",
  importPath: "@inspector/ds",
  source: {
    label: "tabView.tsx",
    path: "packages/design-system/src/components/tabView/tabView.tsx",
  },
  componentId: "tabView",
} satisfies NavItem;

export const checkboxItem = {
  title: "Checkbox",
  slug: "checkbox",
  href: "/components/checkbox",
  description: "Binary and mixed-state selection with Field and native form integration.",
  importPath: "@inspector/ds",
  source: {
    label: "checkbox.tsx",
    path: "packages/design-system/src/components/checkbox/checkbox.tsx",
  },
  componentId: "checkbox",
} satisfies NavItem;

export const switchItem = {
  title: "Switch",
  slug: "switch",
  href: "/components/switch",
  description: "A binary control for settings that take effect when switched on or off.",
  importPath: "@inspector/ds",
  source: {
    label: "switch.tsx",
    path: "packages/design-system/src/components/switch/switch.tsx",
  },
  componentId: "switch",
} satisfies NavItem;

export const tooltipItem = {
  title: "Tooltip",
  slug: "tooltip",
  href: "/components/tooltip",
  description: "Supplementary non-interactive context shown when a trigger is hovered or focused.",
  importPath: "@inspector/ds",
  source: {
    label: "tooltip.tsx",
    path: "packages/design-system/src/components/tooltip/tooltip.tsx",
  },
  componentId: "tooltip",
} satisfies NavItem;

export const toastItem = {
  title: "Toast",
  slug: "toast",
  href: "/components/toast",
  description: "Concise, temporary feedback for user-initiated actions.",
  importPath: "@inspector/ds",
  source: {
    label: "toaster.tsx",
    path: "packages/design-system/src/components/toaster/toaster.tsx",
  },
  componentId: "toaster",
} satisfies NavItem;

export const spinnerItem = {
  title: "Spinner",
  slug: "spinner",
  href: "/components/spinner",
  description: "A compact loading indicator with optional accessible status text.",
  importPath: "@inspector/ds",
  source: {
    label: "spinner.tsx",
    path: "packages/design-system/src/components/spinner/spinner.tsx",
  },
  componentId: "spinner",
} satisfies NavItem;

export const inputItem = {
  title: "Input",
  slug: "input",
  href: "/components/input",
  description: "Text input with design-system sizes and Base UI field integration.",
  importPath: "@inspector/ds",
  source: {
    label: "input.tsx",
    path: "packages/design-system/src/components/input/input.tsx",
  },
  componentId: "input",
} satisfies NavItem;

export const inputGroupItem = {
  title: "Input Group",
  slug: "input-group",
  href: "/components/input-group",
  description: "Compound text input with constrained static and interactive affixes.",
  importPath: "@inspector/ds",
  source: {
    label: "inputGroup.tsx",
    path: "packages/design-system/src/components/inputGroup/inputGroup.tsx",
  },
  componentId: "inputGroup",
} satisfies NavItem;

export const keyboardInputItem = {
  title: "Keyboard Input",
  slug: "keyboard-input",
  href: "/components/keyboard-input",
  description: "A semantic shortcut hint with ordered modifier combinations.",
  importPath: "@inspector/ds",
  source: {
    label: "keyboardInput.tsx",
    path: "packages/design-system/src/components/keyboardInput/keyboardInput.tsx",
  },
  componentId: "keyboardInput",
} satisfies NavItem;

export const textareaItem = {
  title: "Textarea",
  slug: "textarea",
  href: "/components/textarea",
  description: "Multiline text entry with field validation and constrained editor treatments.",
  importPath: "@inspector/ds",
  source: {
    label: "textarea.tsx",
    path: "packages/design-system/src/components/textarea/textarea.tsx",
  },
  componentId: "textarea",
} satisfies NavItem;

export const codeEditorItem = {
  title: "Code Editor",
  slug: "code-editor",
  href: "/components/code-editor",
  description: "JSON source editing with formatting, diagnostics, and capped presentation.",
  importPath: "@inspector/ds",
  source: {
    label: "codeEditor.tsx",
    path: "packages/design-system/src/components/codeEditor/codeEditor.tsx",
  },
  componentId: "codeEditor",
} satisfies NavItem;

export const menuItem = {
  title: "Menu",
  slug: "menu",
  href: "/components/menu",
  description: "Action menu built on Base UI Menu with grouped standard and checkbox items.",
  importPath: "@inspector/ds",
  source: {
    label: "menu.tsx",
    path: "packages/design-system/src/components/menu/menu.tsx",
  },
  componentId: "menu",
} satisfies NavItem;

export const contextMenuItem = {
  title: "Context Menu",
  slug: "context-menu",
  href: "/components/context-menu",
  description: "Contextual actions opened from a pointer target without a visible trigger.",
  importPath: "@inspector/ds",
  source: {
    label: "contextMenu.tsx",
    path: "packages/design-system/src/components/contextMenu/contextMenu.tsx",
  },
  componentId: "contextMenu",
} satisfies NavItem;

export const searchItem = {
  title: "Search",
  slug: "search",
  href: "/components/search",
  description: "Free-form search input with a fixed leading search indicator.",
  importPath: "@inspector/ds",
  source: {
    label: "search.tsx",
    path: "packages/design-system/src/components/search/search.tsx",
  },
  componentId: "search",
} satisfies NavItem;

export const accordionItem = {
  title: "Accordion",
  slug: "accordion",
  href: "/components/accordion",
  description: "Collapsible sections with Base UI behavior and compact Inspector presentation.",
  importPath: "@inspector/ds",
  source: {
    label: "accordion.tsx",
    path: "packages/design-system/src/components/accordion/accordion.tsx",
  },
  componentId: "accordion",
} satisfies NavItem;

export const actionListItem = {
  title: "Action List",
  slug: "action-list",
  href: "/components/action-list",
  description: "Selectable action rows with navigation triggers and composable trailing actions.",
  importPath: "@inspector/ds",
  source: {
    label: "actionList.tsx",
    path: "packages/design-system/src/components/actionList/actionList.tsx",
  },
  componentId: "actionList",
} satisfies NavItem;

export const sidePanelItem = {
  title: "Side Panel",
  slug: "side-panel",
  href: "/components/side-panel",
  description: "Full-height panel structure with fixed header and footer regions.",
  importPath: "@inspector/ds",
  source: {
    label: "sidePanel.tsx",
    path: "packages/design-system/src/components/sidePanel/sidePanel.tsx",
  },
  componentId: "sidePanel",
} satisfies NavItem;

export const dataTableItem = {
  title: "Data Table",
  slug: "data-table",
  href: "/components/data-table",
  description: "Controlled TanStack table rendering with semantic structure and inspection states.",
  importPath: "@inspector/ds",
  source: {
    label: "dataTable.tsx",
    path: "packages/design-system/src/components/dataTable/dataTable.tsx",
  },
  componentId: "dataTable",
} satisfies NavItem;

export const jsonViewItem = {
  title: "JSON View",
  slug: "json-view",
  href: "/components/json-view",
  description:
    "Read-only JSON inspection with tree navigation, search highlighting, and bounded rendering.",
  importPath: "@inspector/ds",
  source: {
    label: "jsonView.tsx",
    path: "packages/design-system/src/components/jsonView/jsonView.tsx",
  },
  componentId: "jsonView",
} satisfies NavItem;

export const resizablePanelItem = {
  title: "Resizable Panel",
  slug: "resizable-panel",
  href: "/components/resizable-panel",
  description:
    "Accessible split panels with constrained handles, collapse controls, and layout persistence support.",
  importPath: "@inspector/ds",
  source: {
    label: "resizablePanel.tsx",
    path: "packages/design-system/src/components/resizablePanel/resizablePanel.tsx",
  },
  componentId: "resizablePanelGroup",
} satisfies NavItem;

export const comboboxItem = {
  title: "Combobox",
  slug: "combobox",
  href: "/components/combobox",
  description: "Filterable single selection from a predefined collection.",
  importPath: "@inspector/ds",
  source: {
    label: "combobox.tsx",
    path: "packages/design-system/src/components/combobox/combobox.tsx",
  },
  componentId: "combobox",
} satisfies NavItem;

export const contextSwitcherItem = {
  title: "Context Switcher",
  slug: "context-switcher",
  href: "/components/context-switcher",
  description: "A searchable popup for changing the active application resource or scope.",
  importPath: "@inspector/ds",
  source: {
    label: "contextSwitcher.tsx",
    path: "packages/design-system/src/components/contextSwitcher/contextSwitcher.tsx",
  },
  componentId: "contextSwitcher",
} satisfies NavItem;

export const selectItem = {
  title: "Select",
  slug: "select",
  href: "/components/select",
  description: "Single selection from a compact predefined collection.",
  importPath: "@inspector/ds",
  source: {
    label: "select.tsx",
    path: "packages/design-system/src/components/select/select.tsx",
  },
  componentId: "select",
} satisfies NavItem;

export const fieldItem = {
  title: "Field",
  slug: "field",
  href: "/components/field",
  description: "Accessible labels, descriptions, and validation for form controls.",
  importPath: "@inspector/ds",
  source: {
    label: "field.tsx",
    path: "packages/design-system/src/components/field/field.tsx",
  },
  componentId: "field",
} satisfies NavItem;

export const fieldsetItem = {
  title: "Fieldset",
  slug: "fieldset",
  href: "/components/fieldset",
  description: "Accessible grouping and shared disabled state for related form controls.",
  importPath: "@inspector/ds",
  source: {
    label: "fieldset.tsx",
    path: "packages/design-system/src/components/fieldset/fieldset.tsx",
  },
  componentId: "fieldset",
} satisfies NavItem;

export const textFieldItem = {
  title: "Text Field",
  slug: "text-field",
  href: "/components/text-field",
  description: "Standard labeled text input with description and validation messaging.",
  importPath: "@inspector/ds",
  source: {
    label: "textField.tsx",
    path: "packages/design-system/src/components/textField/textField.tsx",
  },
  componentId: "textField",
} satisfies NavItem;

export const componentItems: NavItem[] = [
  accordionItem,
  actionListItem,
  buttonItem,
  buttonLinkItem,
  buttonGroupItem,
  checkboxItem,
  codeEditorItem,
  comboboxItem,
  contextMenuItem,
  contextSwitcherItem,
  copyButtonItem,
  dataTableItem,
  inputItem,
  inputGroupItem,
  jsonViewItem,
  keyboardInputItem,
  textLinkItem,
  textareaItem,
  menuItem,
  resizablePanelItem,
  searchItem,
  sidePanelItem,
  selectItem,
  spinnerItem,
  switchItem,
  toastItem,
  tooltipItem,
  fieldItem,
  fieldsetItem,
  textFieldItem,
  tabViewItem,
  toggleGroupItem,
];

export const navSections: NavSection[] = [
  { title: "Foundations", items: foundationItems },
  { title: "Components", items: componentItems },
];

export const navigationItems = navSections.flatMap((section) => section.items);

export function findNavItem(slug: string, items: NavItem[]): NavItem | undefined {
  return items.find((item) => item.slug === slug);
}

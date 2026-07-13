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
  description: "Primitive palette and semantic color tokens from @inspector/ds.",
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

export const checkboxItem = {
  title: "Checkbox",
  slug: "checkbox",
  href: "/components/checkbox",
  description: "Binary and mixed-state selection with Field and Form integration.",
  importPath: "@inspector/ds",
  source: {
    label: "checkbox.tsx",
    path: "packages/design-system/src/components/checkbox/checkbox.tsx",
  },
  componentId: "checkbox",
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

export const formItem = {
  title: "Form",
  slug: "form",
  href: "/components/form",
  description: "Native form submission with consolidated field validation and external errors.",
  importPath: "@inspector/ds",
  source: {
    label: "form.tsx",
    path: "packages/design-system/src/components/form/form.tsx",
  },
  componentId: "form",
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
  buttonItem,
  checkboxItem,
  inputItem,
  fieldItem,
  fieldsetItem,
  formItem,
  textFieldItem,
];

export const navSections: NavSection[] = [
  { title: "Foundations", items: foundationItems },
  { title: "Components", items: componentItems },
];

export function findNavItem(slug: string, items: NavItem[]): NavItem | undefined {
  return items.find((item) => item.slug === slug);
}

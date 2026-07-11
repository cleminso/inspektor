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

export const componentItems: NavItem[] = [buttonItem];

export const navSections: NavSection[] = [
  { title: "Foundations", items: foundationItems },
  { title: "Components", items: componentItems },
];

export function findNavItem(slug: string, items: NavItem[]): NavItem | undefined {
  return items.find((item) => item.slug === slug);
}

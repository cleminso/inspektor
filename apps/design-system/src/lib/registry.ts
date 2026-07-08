export type NavItemStatus = "planned" | "ready";

export interface SourceReference {
  label: string;
  path: string;
}

export interface NavItem {
  title: string;
  slug: string;
  href: string;
  description: string;
  importPath: string;
  source: SourceReference;
  status: NavItemStatus;
  propsSlug?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const foundationItems: NavItem[] = [
  {
    title: "Colors",
    slug: "colors",
    href: "/foundations/colors",
    description: "Core background and foreground tokens from @inspector/ds.",
    importPath: "@inspector/ds/theme",
    source: {
      label: "tokens.stylex.ts",
      path: "packages/design-system/src/tokens/tokens.stylex.ts",
    },
    status: "ready",
  },
  {
    title: "Typography",
    slug: "typography",
    href: "/foundations/typography",
    description: "Text scale, tone, and hierarchy for inspector surfaces.",
    importPath: "@inspector/ds/theme",
    source: {
      label: "tokens.stylex.ts",
      path: "packages/design-system/src/tokens/tokens.stylex.ts",
    },
    status: "planned",
  },
];

export const componentItems: NavItem[] = [
  {
    title: "Box",
    slug: "box",
    href: "/components/box",
    description: "Layout primitive for structured inspector UI.",
    importPath: "@inspector/ds/primitives/box",
    source: {
      label: "box.tsx",
      path: "packages/design-system/src/primitives/box.tsx",
    },
    status: "planned",
    propsSlug: "box",
  },
  {
    title: "Text",
    slug: "text",
    href: "/components/text",
    description: "Typography primitive for readable data-heavy views.",
    importPath: "@inspector/ds/primitives/text",
    source: {
      label: "text.tsx",
      path: "packages/design-system/src/primitives/text.tsx",
    },
    status: "planned",
    propsSlug: "text",
  },
];

export const navSections: NavSection[] = [
  { title: "Foundations", items: foundationItems },
  { title: "Components", items: componentItems },
];

export function findNavItem(slug: string, items: NavItem[]): NavItem | undefined {
  return items.find((item) => item.slug === slug);
}

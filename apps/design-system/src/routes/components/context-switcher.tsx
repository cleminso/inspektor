import { createFileRoute } from "@tanstack/react-router";

import { ContextSwitcherPage } from "@/components/content/components/contextSwitcher/page";

export const Route = createFileRoute("/components/context-switcher")({
  component: ContextSwitcherPage,
  head: () => ({
    meta: [{ title: "Context Switcher · Inspector Design System" }],
  }),
});

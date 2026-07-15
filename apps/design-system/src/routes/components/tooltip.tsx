import { createFileRoute } from "@tanstack/react-router";

import { TooltipPage } from "@/components/content/components/tooltip/page";

export const Route = createFileRoute("/components/tooltip")({
  component: TooltipPage,
  head: () => ({ meta: [{ title: "Tooltip · Inspector Design System" }] }),
});

import { createFileRoute } from "@tanstack/react-router";

import { MultiSelectPage } from "@/components/content/components/multiSelect/page";

export const Route = createFileRoute("/components/multi-select")({
  component: MultiSelectPage,
  head: () => ({ meta: [{ title: "Multi Select · Inspector Design System" }] }),
});

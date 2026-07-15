import { createFileRoute } from "@tanstack/react-router";

import { ToggleGroupPage } from "@/components/content/components/toggleGroup/page";

export const Route = createFileRoute("/components/toggle-group")({
  component: ToggleGroupPage,
  head: () => ({
    meta: [{ title: "Toggle Group · Inspector Design System" }],
  }),
});

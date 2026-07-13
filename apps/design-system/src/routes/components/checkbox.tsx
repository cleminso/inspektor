import { createFileRoute } from "@tanstack/react-router";

import { CheckboxPage } from "@/components/content/components/checkbox/page";

export const Route = createFileRoute("/components/checkbox")({
  component: CheckboxPage,
  head: () => ({
    meta: [{ title: "Checkbox · Inspector Design System" }],
  }),
});

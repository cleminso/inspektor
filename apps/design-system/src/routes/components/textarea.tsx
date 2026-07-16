import { createFileRoute } from "@tanstack/react-router";

import { TextareaPage } from "@/components/content/components/textarea/page";

export const Route = createFileRoute("/components/textarea")({
  component: TextareaPage,
  head: () => ({
    meta: [{ title: "Textarea · Inspector Design System" }],
  }),
});

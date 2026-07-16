import { createFileRoute } from "@tanstack/react-router";

import { InputGroupPage } from "@/components/content/components/inputGroup/page";

export const Route = createFileRoute("/components/input-group")({
  component: InputGroupPage,
  head: () => ({
    meta: [{ title: "Input Group · Inspector Design System" }],
  }),
});

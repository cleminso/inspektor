import { createFileRoute } from "@tanstack/react-router";

import { FindBarPage } from "@/components/content/components/findBar/page";

export const Route = createFileRoute("/components/find-bar")({
  component: FindBarPage,
  head: () => ({
    meta: [{ title: "Find Bar · Inspector Design System" }],
  }),
});

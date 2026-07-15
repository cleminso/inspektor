import { createFileRoute } from "@tanstack/react-router";

import { CopyButtonPage } from "@/components/content/components/copyButton/page";

export const Route = createFileRoute("/components/copy-button")({
  component: CopyButtonPage,
  head: () => ({
    meta: [{ title: "Copy Button · Inspector Design System" }],
  }),
});

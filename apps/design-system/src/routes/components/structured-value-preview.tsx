import { createFileRoute } from "@tanstack/react-router";

import { StructuredValuePreviewPage } from "@/components/content/components/structuredValuePreview/page";

export const Route = createFileRoute("/components/structured-value-preview")({
  component: StructuredValuePreviewPage,
  head: () => ({ meta: [{ title: "Structured Value Preview · Inspector Design System" }] }),
});

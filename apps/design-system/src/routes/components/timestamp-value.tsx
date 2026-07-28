import { createFileRoute } from "@tanstack/react-router";

import { TimestampValuePage } from "@/components/content/components/timestampValue/page";

export const Route = createFileRoute("/components/timestamp-value")({
  component: TimestampValuePage,
  head: () => ({ meta: [{ title: "Timestamp Value · Inspector Design System" }] }),
});

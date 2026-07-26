import { createFileRoute } from "@tanstack/react-router";

import { SegmentedControlPage } from "@/components/content/components/segmentedControl/page";

export const Route = createFileRoute("/components/segmented-control")({
  component: SegmentedControlPage,
  head: () => ({
    meta: [{ title: "Segmented Control · Inspector Design System" }],
  }),
});

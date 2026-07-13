import { createFileRoute } from "@tanstack/react-router";

import { SearchPage } from "@/components/content/components/search/page";

export const Route = createFileRoute("/components/search")({
  component: SearchPage,
  head: () => ({
    meta: [{ title: "Search · Inspector Design System" }],
  }),
});

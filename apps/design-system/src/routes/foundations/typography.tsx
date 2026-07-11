import { createFileRoute } from "@tanstack/react-router";

import { TypographyFoundationPage } from "@/components/content/foundations/typography";

export const Route = createFileRoute("/foundations/typography")({
  component: TypographyFoundationPage,
  head: () => ({
    meta: [{ title: "Typography · Inspector Design System" }],
  }),
});

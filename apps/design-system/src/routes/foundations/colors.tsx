import { createFileRoute } from "@tanstack/react-router";

import { ColorFoundationPage } from "@/components/content/foundations/color";

export const Route = createFileRoute("/foundations/colors")({
  component: ColorFoundationPage,
  head: () => ({
    meta: [{ title: "Colors · Inspector Design System" }],
  }),
});

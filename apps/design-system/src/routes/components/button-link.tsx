import { createFileRoute } from "@tanstack/react-router";

import { ButtonLinkPage } from "@/components/content/components/buttonLink/page";

export const Route = createFileRoute("/components/button-link")({
  component: ButtonLinkPage,
  head: () => ({ meta: [{ title: "Button Link · Inspector Design System" }] }),
});

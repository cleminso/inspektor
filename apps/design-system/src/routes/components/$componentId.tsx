import { createFileRoute } from "@tanstack/react-router";

import { ComponentPage } from "@/components/page";

export const Route = createFileRoute("/components/$componentId")({
  component: ComponentPage,
});

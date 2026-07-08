import { createFileRoute } from "@tanstack/react-router";

import { AddConnectionPane } from "@/components/onboarding/addConnectionPane";

export const Route = createFileRoute("/conn/new")({
  component: AddConnectionPane,
});

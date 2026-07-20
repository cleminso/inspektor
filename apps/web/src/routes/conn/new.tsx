import { createFileRoute } from "@tanstack/react-router";

import { AddConnectionView } from "@/components/onboarding/addConnectionView";

export const Route = createFileRoute("/conn/new")({
  component: AddConnectionView,
});

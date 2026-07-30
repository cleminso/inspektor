import { createFileRoute } from "@tanstack/react-router";

import { AddConnectionView } from "@onboarding/addConnectionView";

export const Route = createFileRoute("/conn/new")({
  component: AddConnectionView,
});

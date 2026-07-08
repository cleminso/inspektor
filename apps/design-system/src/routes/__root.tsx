import { createRootRoute } from "@tanstack/react-router";

import { AppShell } from "@/layout/appShell";

export const Route = createRootRoute({
  component: AppShell,
});

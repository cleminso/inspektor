import { createFileRoute, redirect } from "@tanstack/react-router";

import { appRoutes } from "@/lib/navigation/appRoutes";

export const Route = createFileRoute("/conn/$connectionId/")({
  loader: ({ params }) => {
    throw redirect({
      to: appRoutes.tables,
      params: { connectionId: params.connectionId },
    });
  },
});

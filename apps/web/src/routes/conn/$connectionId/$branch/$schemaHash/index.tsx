import { createFileRoute, redirect } from "@tanstack/react-router";

import { appRoutes } from "@/lib/navigation/appRoutes";

export const Route = createFileRoute("/conn/$connectionId/$branch/$schemaHash/")({
  loader: ({ params }) => {
    throw redirect({
      to: appRoutes.tables,
      params,
    });
  },
});

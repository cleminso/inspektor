import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/conn/$connectionId/tables/$tableName/")({
  component: TableDataRoute,
});

function TableDataRoute(): null {
  return null;
}

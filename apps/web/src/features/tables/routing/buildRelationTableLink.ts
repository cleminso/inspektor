import { appRoutes } from "@app/routing/appRoutes";

/** Opens the referenced table's base workspace view inside the current connection context. */
export function buildRelationTableLink(input: {
  connectionId: string;
  tableName: string;
}) {
  return {
    to: appRoutes.table,
    params: {
      connectionId: input.connectionId,
      tableName: input.tableName,
    },
    search: {},
  } as const;
}

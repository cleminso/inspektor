import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon } from "lucide-react";

import { useInspector } from "@/components/providers/inspectorProvider";
import { useRelationRow } from "@/hooks/useRelationRow";
import { buildRelationTableLink } from "@/lib/table-explorer/relationNavigation";

interface RelationCellLinkProps {
  relationId: string;
  relationTable: string;
}

export function RelationCellLink({ relationId, relationTable }: RelationCellLinkProps): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspector();
  const { displayValue } = useRelationRow(relationTable, relationId);

  if (currentConnectionId === null || currentBranch === null || currentSchemaHash === null) {
    return <span className="truncate">{displayValue}</span>;
  }

  const relationLink = buildRelationTableLink({
    connectionId: currentConnectionId,
    branch: currentBranch,
    schemaHash: currentSchemaHash,
    tableName: relationTable,
    relationId,
  });

  return (
    <Link
      to={relationLink.to}
      params={relationLink.params}
      search={relationLink.search}
      className="inline-flex items-center gap-1 truncate text-foreground underline-offset-4 hover:underline"
      title={`${relationTable}.${relationId}`}
    >
      <span className="truncate">{displayValue}</span>
      <ExternalLinkIcon className="size-3 shrink-0" />
    </Link>
  );
}

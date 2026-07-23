import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";

import { TextLink } from "@inspector/ds";

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
    return <>{displayValue}</>;
  }

  const relationLink = buildRelationTableLink({
    connectionId: currentConnectionId,
    branch: currentBranch,
    schemaHash: currentSchemaHash,
    tableName: relationTable,
    relationId,
  });

  return (
    <TextLink
      render={
        <Link
          to={relationLink.to}
          params={relationLink.params}
          search={relationLink.search}
        />
      }
      trailingIcon={<ArrowRightIcon size={12} />}
      title={`${relationTable}.${relationId}`}
    >
      {displayValue}
    </TextLink>
  );
}

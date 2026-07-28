import { Link } from "@tanstack/react-router";

import { RelationValue } from "@inspector/ds";

import { useInspector } from "@/components/providers/inspectorProvider";
import { buildRelationTableLink } from "@/lib/table-explorer/relationNavigation";

interface RelationCellLinkProps {
  relationId: string;
  relationTable: string;
}

export function RelationCellLink({ relationId, relationTable }: RelationCellLinkProps): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspector();

  if (currentConnectionId === null || currentBranch === null || currentSchemaHash === null) {
    return <RelationValue id={relationId} />;
  }

  const relationLink = buildRelationTableLink({
    connectionId: currentConnectionId,
    branch: currentBranch,
    schemaHash: currentSchemaHash,
    tableName: relationTable,
    relationId,
  });

  return (
    <RelationValue
      id={relationId}
      navigation={{
        render: (
          <Link
            to={relationLink.to}
            params={relationLink.params}
            search={relationLink.search}
          />
        ),
      }}
    />
  );
}

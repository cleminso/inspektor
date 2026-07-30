import { Link } from "@tanstack/react-router";

import { RelationValue } from "@inspector/ds";

import { useInspector } from "@app/providers/inspectorProvider";
import { buildRelationTableLink } from "@tables/routing/buildRelationTableLink";

interface RelationCellLinkProps {
  relationId: string;
  relationTable: string;
}

export function RelationCellLink({ relationId, relationTable }: RelationCellLinkProps): React.ReactElement {
  const { currentConnectionId } = useInspector();

  if (currentConnectionId === null) {
    return <RelationValue id={relationId} />;
  }

  const relationLink = buildRelationTableLink({
    connectionId: currentConnectionId,
    tableName: relationTable,
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

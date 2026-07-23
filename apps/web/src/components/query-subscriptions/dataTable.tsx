import { Fragment } from "react";

import { ChevronDown, ChevronRight } from "lucide-react";
import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { Box, Button, DataTable, Text } from "@inspector/ds";

import { ActionsBar } from "@/components/query-subscriptions/actionsBar";
import { QuerySubscriptionsExpandedRow } from "@/components/query-subscriptions/expandedRow";
import type { UseQuerySubscriptionsStateResult } from "@/components/query-subscriptions/useQuerySubscriptionsState";
import type { QuerySubscriptionRow } from "@/types/querySubscriptions";

function getEmptyStateCopy(selectedTableName: string | null): {
  description: string;
  title: string;
} {
  if (selectedTableName !== null) {
    return {
      title: `No active subscriptions for ${selectedTableName}`,
      description: "This table currently has no tracked server subscriptions.",
    };
  }

  return {
    title: "No active subscriptions",
    description: "Subscriptions appear here after a Jazz query mounts.",
  };
}

function TableMessage({
  description,
  title,
}: {
  description: string;
  title: string;
}): React.ReactElement {
  return (
    <Box flexDirection="column" alignItems="center" gap="xs">
      <Text as="span" variant="label">
        {title}
      </Text>
      <Text as="span" color="muted" variant="caption">
        {description}
      </Text>
    </Box>
  );
}

function HeaderLabel({ title }: { title: string }): React.ReactElement {
  return (
    <Text as="span" color="muted" variant="caption">
      {title}
    </Text>
  );
}

const columns: ColumnDef<QuerySubscriptionRow>[] = [
  {
    id: "expander",
    size: 40,
    minSize: 40,
    maxSize: 40,
    header: () => null,
    cell: ({ row }) => {
      const Icon = row.getIsExpanded() === true ? ChevronDown : ChevronRight;

      return (
        <Button
          type="button"
          variant="ghost"
          size="s"
          shape="square"
          onClick={(event) => {
            event.stopPropagation();
            row.toggleExpanded();
          }}
          aria-label={row.getIsExpanded() === true ? "Collapse query row" : "Expand query row"}
        >
          <Icon aria-hidden="true" size={14} />
        </Button>
      );
    },
  },
  {
    accessorKey: "table",
    size: 240,
    header: () => <HeaderLabel title="Table" />,
    cell: ({ row }) => (
      <Text as="span" variant="label">
        {row.original.table}
      </Text>
    ),
  },
  {
    accessorKey: "propagation",
    size: 160,
    header: () => <HeaderLabel title="Propagation" />,
    cell: ({ row }) => <Text as="span">{row.original.propagation}</Text>,
  },
  {
    accessorKey: "count",
    size: 100,
    header: () => <HeaderLabel title="Count" />,
    cell: ({ row }) => <Text as="span">{row.original.count}</Text>,
  },
];

interface QuerySubscriptionsTableProps {
  state: UseQuerySubscriptionsStateResult;
}

export function QuerySubscriptionsTable({
  state,
}: QuerySubscriptionsTableProps): React.ReactElement {
  const emptyStateCopy = getEmptyStateCopy(state.selectedTableName);
  const table = useReactTable({
    data: state.filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowCanExpand: () => true,
    getRowId: (row) => row.groupKey,
  });

  return (
    <Box
      minHeight={0}
      minWidth={0}
      flex={1}
      flexDirection="column"
      overflow="hidden"
      backgroundColor="bg-page"
    >
      <ActionsBar
        error={state.error}
        generatedAt={state.generatedAt}
        isRefreshing={state.isRefreshing}
        rowCount={state.rows.length}
      />
      <Box minHeight={0} minWidth={0} flex={1} overflow="hidden">
        <DataTable.Root table={table} density="compact">
          <DataTable.Viewport>
            <DataTable.Table aria-label="Query subscriptions">
              <DataTable.Header />
              {state.error !== null &&
              state.rows.length === 0 &&
              state.isInitialLoading === false ? (
                <DataTable.Empty>
                  <TableMessage
                    title="Unable to load subscription telemetry"
                    description={state.error}
                  />
                </DataTable.Empty>
              ) : state.isInitialLoading === true && state.rows.length === 0 ? (
                <DataTable.Loading>
                  <TableMessage
                    title="Loading subscriptions"
                    description="Fetching active server subscriptions."
                  />
                </DataTable.Loading>
              ) : state.filteredRows.length === 0 ? (
                <DataTable.Empty>
                  <TableMessage
                    title={emptyStateCopy.title}
                    description={emptyStateCopy.description}
                  />
                </DataTable.Empty>
              ) : (
                <DataTable.Body>
                  {table.getRowModel().rows.map((row) => (
                    <Fragment key={row.id}>
                      <DataTable.Row row={row} />
                      {row.getIsExpanded() === true ? (
                        <DataTable.ExpandedRow row={row}>
                          <QuerySubscriptionsExpandedRow row={row.original} />
                        </DataTable.ExpandedRow>
                      ) : null}
                    </Fragment>
                  ))}
                </DataTable.Body>
              )}
            </DataTable.Table>
          </DataTable.Viewport>
        </DataTable.Root>
      </Box>
    </Box>
  );
}

import { XIcon } from "lucide-react";
import type { ColumnDescriptor } from "jazz-tools";

import { Box, Button, Text, type DataTableCellTarget } from "@inspector/ds";

import { DetailPane } from "@/components/table-explorer/detailPane";
import { formatMutationFieldValue } from "@/lib/table-explorer/mutationParsing";

interface CellInspectorSidePanelProps {
  columnPosition: number | null;
  onClose: () => void;
  rowPosition: number | null;
  rowValues: Record<string, unknown> | null;
  schemaColumns: ColumnDescriptor[];
  target: DataTableCellTarget | null;
}

export function CellInspectorSidePanel({
  columnPosition,
  onClose,
  rowPosition,
  rowValues,
  schemaColumns,
  target,
}: CellInspectorSidePanelProps): React.ReactElement {
  const coordinate =
    rowPosition !== null && columnPosition !== null
      ? `${rowPosition + 1}:${columnPosition + 1}`
      : null;

  return (
    <DetailPane
      title={
        <Box alignItems="center" flex={1} gap="m" minWidth={0}>
          <Box as="span" flex={1} minWidth={0}>
            <Text as="span" truncate>
              {coordinate === null ? "Cell" : `Cell ${coordinate}`}
            </Text>
          </Box>
          <Button
            type="button"
            aria-label="Close cell inspector"
            variant="ghost"
            size="s"
            shape="square"
            onClick={onClose}
          >
            <XIcon />
          </Button>
        </Box>
      }
    >
      <Box
        flex={1}
        flexDirection="column"
        gap="m"
        minHeight={0}
        overflowY="auto"
        padding="s"
        unsafeClassName="app-scrollbar"
      >
        {target === null || rowValues === null ? (
          <Text color="muted">The selected cell is unavailable.</Text>
        ) : (
          <CellValue rowValues={rowValues} schemaColumns={schemaColumns} target={target} />
        )}
      </Box>
    </DetailPane>
  );
}

function CellValue({
  rowValues,
  schemaColumns,
  target,
}: {
  rowValues: Record<string, unknown>;
  schemaColumns: ColumnDescriptor[];
  target: DataTableCellTarget;
}): React.ReactElement {
  const column = schemaColumns.find((candidate) => candidate.name === target.columnId);
  const value = rowValues[target.columnId];
  const formattedValue =
    value === null || value === undefined
      ? "NULL"
      : column === undefined
        ? String(value)
        : formatMutationFieldValue(value, column.column_type);

  return (
    <>
      {column === undefined ? null : (
        <Text color="muted" variant="caption">
          {column.column_type.type.toLowerCase()}
        </Text>
      )}
      <Text>{formattedValue}</Text>
    </>
  );
}

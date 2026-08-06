import { useEffect, useState } from "react";

import { Box, Button, Icon, Select, Text, Tooltip } from "@inspector/ds";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { TABLE_PAGE_SIZE_OPTIONS } from "@tables/query/tableRowsQuery";
import type { TablePageSize } from "@tables/tableTypes";

const pageSizeItems = TABLE_PAGE_SIZE_OPTIONS.map((value) => ({
  label: String(value),
  value,
}));

const rowCountFormatter = new Intl.NumberFormat("en-US");

interface TablePaginationProps {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  loadedRowCount: number;
  loading?: boolean;
  page: number;
  pageSize: TablePageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: TablePageSize) => void;
}

interface PaginationSummary {
  hasNextPage: boolean;
  loadedRowCount: number;
  page: number;
  pageSize: TablePageSize;
}

export function TablePagination({
  hasNextPage,
  hasPreviousPage,
  loadedRowCount,
  loading = false,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps): React.ReactElement {
  const currentSummary = { hasNextPage, loadedRowCount, page, pageSize };
  const [settledSummary, setSettledSummary] = useState<PaginationSummary>(currentSummary);
  useEffect(() => {
    if (loading === false) {
      setSettledSummary({ hasNextPage, loadedRowCount, page, pageSize });
    }
  }, [hasNextPage, loadedRowCount, loading, page, pageSize]);
  const summary = loading === true ? settledSummary : currentSummary;
  const firstRow = summary.loadedRowCount === 0 ? 0 : (summary.page - 1) * summary.pageSize + 1;
  const lastRow = (summary.page - 1) * summary.pageSize + summary.loadedRowCount;
  const total =
    summary.hasNextPage === true
      ? `${rowCountFormatter.format(lastRow + 1)}+`
      : rowCountFormatter.format(lastRow);
  const rowStatus = `${rowCountFormatter.format(firstRow)}–${rowCountFormatter.format(lastRow)} of ${total}`;

  return (
    <Box alignItems="center" gap="xs">
      <Text color="muted" variant="caption">
        {rowStatus}
      </Text>
      <Select.Root
        items={pageSizeItems}
        value={pageSize}
        onValueChange={(value) => {
          if (value !== null) {
            onPageSizeChange(value);
          }
        }}
      >
        <Select.Trigger aria-label="Rows per page" size="s" width="compact">
          <Select.Value />
        </Select.Trigger>
        <Select.Content align="start" side="bottom">
          {pageSizeItems.map((item) => (
            <Select.Item key={item.value} value={item.value} size="s">
              <Select.ItemIndicator />
              <Select.ItemText>{item.label}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <Button
              aria-label="Previous page"
              disabled={loading === true || hasPreviousPage === false}
              iconOnly
              size="s"
              variant="ghost"
              onClick={() => onPageChange(page - 1)}
            >
              <Icon render={<ChevronLeft />} size="s" />
            </Button>
          }
        />
        <Tooltip.Content>Previous page</Tooltip.Content>
      </Tooltip.Root>
      <Text color="muted" data-numeric-variant="tabular" tabularNums variant="caption">
        Page {summary.page}
      </Text>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <Button
              aria-label="Next page"
              disabled={loading === true || hasNextPage === false}
              iconOnly
              size="s"
              variant="ghost"
              onClick={() => onPageChange(page + 1)}
            >
              <Icon render={<ChevronRight />} size="s" />
            </Button>
          }
        />
        <Tooltip.Content>Next page</Tooltip.Content>
      </Tooltip.Root>
    </Box>
  );
}

interface ToolbarProps {
  actions: React.ReactNode;
  children?: React.ReactNode;
  pagination?: React.ReactNode;
}

export function Toolbar({ actions, children, pagination }: ToolbarProps): React.ReactElement {
  return (
    <Box
      width="full"
      flexShrink={0}
      alignItems="center"
      gap="s"
      padding="s"
      backgroundColor="bg-page"
    >
      <Box minWidth={0} flex={1}>
        {children}
      </Box>
      <Box flexShrink={0} alignItems="center" gap="s">
        {pagination}
      </Box>
      {actions}
    </Box>
  );
}

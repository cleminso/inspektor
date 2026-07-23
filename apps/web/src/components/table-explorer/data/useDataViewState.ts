import { useMemo, useState } from "react";

import type { DataTableCellTarget } from "@inspector/ds";
import type { Table } from "@tanstack/react-table";
import type { ColumnDescriptor, DynamicTableRow } from "jazz-tools";
import { useAll } from "jazz-tools/react";

import { useInspector } from "@/components/providers/inspectorProvider";
import { useDataTable } from "@/components/table-explorer/data/useDataTable";
import { useInspectorColumnVisibility } from "@/hooks/useInspectorColumnVisibility";
import { useInspectorColumnOrder } from "@/hooks/useInspectorColumnOrder";
import { useInspectorRowEditor } from "@/hooks/useInspectorRowEditor";
import { useTableExplorerSearchParams } from "@/hooks/useTableExplorerSearchParams";
import { useTableMutations } from "@/hooks/useTableMutations";
import { useTableQuery } from "@/hooks/useTableQuery";
import { GenericQueryBuilder } from "@/lib/table-explorer/genericQueryBuilder";
import { getFieldReadOnlyReason } from "@/lib/table-explorer/mutationParsing";
import { getTableColumns } from "@/lib/table-explorer/tableSchema";
import type { TableFilterClause } from "@/types/tableFilters";
import type { InspectorRowEditorMode, TableRowId } from "@/types/tableExplorer";

interface UseDataViewStateOptions {
  tableName: string;
}

interface DataViewRowEditorState {
  activeRowId: TableRowId | null;
  activeRowIndex: number;
  editedRowIds: TableRowId[];
  goToNextRow: () => void;
  goToPreviousRow: () => void;
  isOpen: boolean;
  mode: InspectorRowEditorMode;
  openInsert: () => void;
}

interface InsertRowSaveOptions {
  keepOpen: boolean;
}

interface UseDataViewStateResult {
  activeCell: DataTableCellTarget | null;
  activeColumnId: string | null;
  columnOrder: string[];
  fetchMore: () => void;
  filters: TableFilterClause[];
  handleDelete: (() => Promise<void>) | undefined;
  handleEditSave: (values: Record<string, unknown>) => Promise<void>;
  handleEscape: () => void;
  handleInsertSave: (
    values: Record<string, unknown>,
    options?: InsertRowSaveOptions,
  ) => Promise<void>;
  handleCellActivate: (target: DataTableCellTarget) => void;
  handleColumnActivate: (columnId: string | null) => void;
  handleRowActivate: (rowId: TableRowId) => void;
  handleRowEditorOpenChange: (open: boolean) => void;
  hasMore: boolean;
  isFetchingMore: boolean;
  loadedRowCount: number;
  rowEditor: DataViewRowEditorState;
  rowValues: Record<string, unknown> | null;
  schemaColumns: ColumnDescriptor[];
  setFilters: (filters: TableFilterClause[]) => Promise<void>;
  setColumnOrder: (columnIds: string[]) => void;
  table: Table<DynamicTableRow>;
}

function createInsertRowValues(schemaColumns: ColumnDescriptor[]): Record<string, unknown> {
  return Object.fromEntries(
    schemaColumns.map((column) => {
      const readOnlyReason = getFieldReadOnlyReason(column);
      const initialValue =
        readOnlyReason === "binary" && column.column_type.type === "Bytea"
          ? new Uint8Array()
          : undefined;

      return [column.name, initialValue];
    }),
  );
}

export function useDataViewState({ tableName }: UseDataViewStateOptions): UseDataViewStateResult {
  const { currentBranch, currentConnectionId, currentSchemaHash, runtime } = useInspector();
  const searchState = useTableExplorerSearchParams();
  const query = useTableQuery({ tableName });
  const schemaColumns = useMemo(
    () => getTableColumns(runtime.wasmSchema, tableName),
    [runtime.wasmSchema, tableName],
  );
  const rowEditor = useInspectorRowEditor();
  // Store only the focused column; the URL-owned active row derives the complete cell target so navigation cannot desynchronize them.
  const [activeCellColumnId, setActiveCellColumnId] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<TableRowId[]>([]);
  const mutations = useTableMutations(tableName);
  const tableKey = `${currentConnectionId ?? "unknown"}:${currentBranch ?? "unknown"}:${currentSchemaHash ?? "unknown"}:${tableName}`;
  const columnIds = useMemo(() => query.columns.map((column) => column.id), [query.columns]);
  const visibility = useInspectorColumnVisibility({
    tableKey,
    columnIds,
  });
  const order = useInspectorColumnOrder({
    tableKey,
    columnIds,
  });

  const editorMode = searchState.editorMode ?? "closed";
  const activeRowId = searchState.editorMode === "edit" ? searchState.rowId : null;
  const activeCell =
    activeCellColumnId !== null && activeRowId !== null
      ? { columnId: activeCellColumnId, rowId: activeRowId }
      : null;
  const editedRowIds = useMemo(() => {
    if (activeRowId === null) {
      return [];
    }

    if (rowEditor.editedRowIds.includes(activeRowId) === true) {
      return rowEditor.editedRowIds;
    }

    return [activeRowId];
  }, [activeRowId, rowEditor.editedRowIds]);
  const activeRowIndex = activeRowId === null ? 0 : Math.max(editedRowIds.indexOf(activeRowId), 0);
  const validRowIds = useMemo(() => query.rows.map((row) => String(row.id)), [query.rows]);
  const visibleSelectedRowIds = useMemo(
    () => selectedRowIds.filter((rowId) => validRowIds.includes(rowId) === true),
    [selectedRowIds, validRowIds],
  );

  const activeRowQueryBuilder = useMemo(() => {
    if (runtime.wasmSchema === null || activeRowId === null || searchState.editorMode !== "edit") {
      return null;
    }

    return new GenericQueryBuilder(tableName, runtime.wasmSchema)
      .where({ id: activeRowId })
      .limit(1)
      .offset(0);
  }, [activeRowId, runtime.wasmSchema, searchState.editorMode, tableName]);
  const activeRowQueryOptions = useMemo(() => {
    return {
      propagation: "full" as const,
      visibility: "hidden_from_live_query_list" as const,
    };
  }, []);
  const activeRows = useAll<DynamicTableRow>(
    activeRowQueryBuilder ?? undefined,
    activeRowQueryOptions,
  );

  const handleSelectedRowIdsChange = (nextSelectedRowIds: TableRowId[]) => {
    setSelectedRowIds(nextSelectedRowIds);
    setActiveCellColumnId(null);
    setActiveColumnId(null);

    if (nextSelectedRowIds.length === 0) {
      rowEditor.close();
      void searchState.setRowEditor(null, null, { replace: false });
      return;
    }

    const newlySelectedRowId = nextSelectedRowIds.find(
      (rowId) => selectedRowIds.includes(rowId) === false,
    );
    const nextActiveRowId =
      newlySelectedRowId ??
      (activeRowId !== null && nextSelectedRowIds.includes(activeRowId) === true
        ? activeRowId
        : nextSelectedRowIds[0]);
    if (nextActiveRowId === undefined) {
      return;
    }

    const nextActiveRowIndex = nextSelectedRowIds.indexOf(nextActiveRowId);
    rowEditor.openEdit(nextSelectedRowIds, nextActiveRowIndex);
    void searchState.setRowEditor("edit", nextActiveRowId, { replace: false });
  };

  const activateRow = (rowId: TableRowId) => {
    const navigationRowIds = selectedRowIds.includes(rowId) === true ? selectedRowIds : [rowId];
    const activeIndex = Math.max(navigationRowIds.indexOf(rowId), 0);

    rowEditor.openEdit(navigationRowIds, activeIndex);
    void searchState.setRowEditor("edit", rowId, { replace: false });
  };

  const table = useDataTable({
    columnOrder: order.columnOrder,
    rows: query.rows,
    columns: query.columns,
    sortColumn: searchState.sortColumn,
    sortDirection: searchState.sortDirection,
    selectedRowIds: visibleSelectedRowIds,
    columnVisibility: visibility.columnVisibility,
    onSortChange: searchState.setSorting,
    onSelectedRowIdsChange: handleSelectedRowIdsChange,
    onColumnVisibilityChange: visibility.setColumnVisibility,
  });
  const selectedRow = useMemo(() => {
    const visibleSelectedRow = query.rows.find((row) => String(row.id) === activeRowId) ?? null;
    if (visibleSelectedRow !== null) {
      return visibleSelectedRow;
    }

    return activeRows?.[0] ?? null;
  }, [activeRowId, activeRows, query.rows]);
  const rowValues = useMemo(() => {
    if (searchState.editorMode === "insert") {
      return createInsertRowValues(schemaColumns);
    }

    return selectedRow;
  }, [schemaColumns, searchState.editorMode, selectedRow]);

  const closeDetailPane = () => {
    rowEditor.close();
    setActiveCellColumnId(null);
    setActiveColumnId(null);
    void searchState.setRowEditor(null, null, { replace: false });
  };

  const handleEscape = () => {
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      activeElement.closest('[data-slot="data-table-cell"]') !== null
    ) {
      activeElement.blur();
    }
    closeDetailPane();
  };

  const openInsert = () => {
    rowEditor.openInsert();
    setActiveCellColumnId(null);
    setActiveColumnId(null);
    void searchState.setRowEditor("insert", null, { replace: false });
  };

  const goToRowIndex = (nextActiveRowIndex: number) => {
    const nextActiveRowId = editedRowIds[nextActiveRowIndex] ?? null;
    if (nextActiveRowId === null) {
      return;
    }

    rowEditor.setActiveRowIndex(nextActiveRowIndex);
    void searchState.setRowEditor("edit", nextActiveRowId, { replace: false });
  };

  const goToPreviousRow = () => {
    goToRowIndex(Math.max(activeRowIndex - 1, 0));
  };

  const goToNextRow = () => {
    goToRowIndex(Math.min(activeRowIndex + 1, editedRowIds.length - 1));
  };

  const handleDelete =
    searchState.editorMode === "edit" && activeRowId !== null
      ? async () => {
          const rowIdToDelete = activeRowId;

          if (rowIdToDelete === null) {
            return;
          }

          await mutations.deleteRow(rowIdToDelete);
          const nextEditedRowIds = editedRowIds.filter((rowId) => rowId !== rowIdToDelete);

          if (nextEditedRowIds.length === 0) {
            closeDetailPane();
            return;
          }

          const nextActiveRowIndex = Math.min(activeRowIndex, nextEditedRowIds.length - 1);
          const nextActiveRowId = nextEditedRowIds[nextActiveRowIndex] ?? null;
          rowEditor.openEdit(nextEditedRowIds, nextActiveRowIndex);
          void searchState.setRowEditor("edit", nextActiveRowId, { replace: false });
        }
      : undefined;

  return {
    activeCell,
    activeColumnId,
    columnOrder: order.columnOrder,
    table,
    loadedRowCount: query.loadedRowCount,
    hasMore: query.hasMore,
    isFetchingMore: query.isFetchingMore,
    fetchMore: query.fetchMore,
    filters: searchState.filters,
    setFilters: searchState.setFilters,
    setColumnOrder: order.setColumnOrder,
    schemaColumns,
    rowValues,
    rowEditor: {
      activeRowId,
      activeRowIndex,
      editedRowIds,
      goToNextRow,
      goToPreviousRow,
      isOpen: searchState.editorMode !== null,
      mode: editorMode,
      openInsert,
    },
    handleCellActivate: (target) => {
      setActiveCellColumnId(target.columnId);
      setActiveColumnId(null);
      activateRow(target.rowId);
    },
    handleEscape,
    handleColumnActivate: (columnId) => {
      setActiveCellColumnId(null);
      setActiveColumnId(columnId);
    },
    handleRowActivate: (rowId) => {
      setActiveCellColumnId(null);
      setActiveColumnId(null);
      activateRow(rowId);
    },
    handleRowEditorOpenChange: (open) => {
      if (open === false) {
        closeDetailPane();
      }
    },
    handleDelete,
    handleEditSave: async (values) => {
      if (activeRowId !== null) {
        await mutations.updateRow(activeRowId, values);
      }
    },
    handleInsertSave: async (values, options) => {
      await mutations.insertRow(values);
      query.resetLoadedRows();

      if (options?.keepOpen === true) {
        return;
      }

      closeDetailPane();
    },
  };
}

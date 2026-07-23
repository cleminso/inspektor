import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { DataTableCellSelectionMode, DataTableCellTarget } from "@inspector/ds";
import type { Table } from "@tanstack/react-table";
import type { ColumnDescriptor, DynamicTableRow } from "jazz-tools";
import { useAll } from "jazz-tools/react";

import { useInspector } from "@/components/providers/inspectorProvider";
import {
  type CellSelectionState,
  updateCellSelection,
} from "@/components/table-explorer/data/cellSelection";
import { focusRowEditorField } from "@/components/table-explorer/data/editRowForm";
import { useDataTable } from "@/components/table-explorer/data/useDataTable";
import {
  getNearestSelectedRowId,
  updateRowSelection,
} from "@/components/table-explorer/data/rowSelection";
import { useInspectorColumnVisibility } from "@/hooks/useInspectorColumnVisibility";
import { useInspectorColumnOrder } from "@/hooks/useInspectorColumnOrder";
import { useTableExplorerSearchParams } from "@/hooks/useTableExplorerSearchParams";
import { useTableMutations } from "@/hooks/useTableMutations";
import { useTableQuery } from "@/hooks/useTableQuery";
import { GenericQueryBuilder } from "@/lib/table-explorer/genericQueryBuilder";
import { getFieldReadOnlyReason } from "@/lib/table-explorer/mutationParsing";
import { getTableColumns } from "@/lib/table-explorer/tableSchema";
import type { TableFilterClause } from "@/types/tableFilters";
import type { TableRowId } from "@/types/tableExplorer";

interface UseDataViewStateOptions {
  tableName: string;
}

interface DataViewRowEditorState {
  activeRowId: TableRowId | null;
  activeRowIndex: number;
  editedRowIds: TableRowId[];
  goToNextRow: () => void;
  goToPreviousRow: () => void;
  openInsert: () => void;
}

export type DataViewDetailPaneMode = "cells" | "closed" | "insert" | "rows";

interface DataViewCellInspectorState {
  columnPosition: number | null;
  rowPosition: number | null;
  rowValues: Record<string, unknown> | null;
  target: DataTableCellTarget | null;
}

interface InsertRowSaveOptions {
  keepOpen: boolean;
}

interface UseDataViewStateResult {
  activeCell: DataTableCellTarget | null;
  activeColumnId: string | null;
  columnOrder: string[];
  cellInspector: DataViewCellInspectorState;
  detailPaneMode: DataViewDetailPaneMode;
  fetchMore: () => void;
  filters: TableFilterClause[];
  handleDelete: (() => Promise<void>) | undefined;
  handleEditSave: (values: Record<string, unknown>) => Promise<void>;
  handleEscape: () => void;
  handleInsertSave: (
    values: Record<string, unknown>,
    options?: InsertRowSaveOptions,
  ) => Promise<void>;
  handleCellActivate: (
    target: DataTableCellTarget,
    selectionMode: DataTableCellSelectionMode,
  ) => void;
  handleCellOpen: (target: DataTableCellTarget) => void;
  handleColumnActivate: (columnId: string | null) => void;
  handleRowEditorOpenChange: (open: boolean) => void;
  hasMore: boolean;
  isFetchingMore: boolean;
  loadedRowCount: number;
  rowEditor: DataViewRowEditorState;
  rowValues: Record<string, unknown> | null;
  schemaColumns: ColumnDescriptor[];
  selectedCells: DataTableCellTarget[];
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

function createEmptyCellSelection(): CellSelectionState {
  return { activeCell: null, anchorCell: null, selectedCells: [] };
}

export function useDataViewState({ tableName }: UseDataViewStateOptions): UseDataViewStateResult {
  const { currentBranch, currentConnectionId, currentSchemaHash, runtime } = useInspector();
  const searchState = useTableExplorerSearchParams();
  const query = useTableQuery({ tableName });
  const schemaColumns = useMemo(
    () => getTableColumns(runtime.wasmSchema, tableName),
    [runtime.wasmSchema, tableName],
  );
  const editorMode = searchState.editorMode ?? "closed";
  const activeRowId = searchState.editorMode === "edit" ? searchState.rowId : null;
  const [cellSelection, setCellSelection] = useState<CellSelectionState>(createEmptyCellSelection);
  const activeCell = cellSelection.activeCell;
  const [cellPaneOpen, setCellPaneOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<TableRowId[]>(() =>
    activeRowId === null ? [] : [activeRowId],
  );
  const [rowSelectionAnchorId, setRowSelectionAnchorId] = useState<TableRowId | null>(null);
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

  const detailPaneMode: DataViewDetailPaneMode =
    cellPaneOpen === true ? "cells" : editorMode === "edit" ? "rows" : editorMode;
  const selectionScopeKey = useMemo(
    () =>
      JSON.stringify({
        filters: searchState.filters,
        sortColumn: searchState.sortColumn,
        sortDirection: searchState.sortDirection,
        tableKey,
      }),
    [searchState.filters, searchState.sortColumn, searchState.sortDirection, tableKey],
  );
  const selectionScopeKeyRef = useRef(selectionScopeKey);
  const effectiveSelectedRowIds = useMemo(() => {
    if (activeRowId === null) {
      return selectedRowIds;
    }

    if (selectedRowIds.includes(activeRowId) === true) {
      return selectedRowIds;
    }

    return [activeRowId];
  }, [activeRowId, selectedRowIds]);
  const editedRowIds = activeRowId === null ? [] : effectiveSelectedRowIds;
  const activeRowIndex = activeRowId === null ? 0 : Math.max(editedRowIds.indexOf(activeRowId), 0);
  const validRowIds = useMemo(() => query.rows.map((row) => String(row.id)), [query.rows]);
  const visibleSelectedRowIds = useMemo(() => {
    const validRowIdSet = new Set(validRowIds);
    return effectiveSelectedRowIds.filter((rowId) => validRowIdSet.has(rowId) === true);
  }, [effectiveSelectedRowIds, validRowIds]);

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

  const openRows = (nextSelectedRowIds: TableRowId[], nextActiveRowId: TableRowId | null) => {
    setSelectedRowIds(nextSelectedRowIds);
    setActiveColumnId(null);
    setCellPaneOpen(false);

    if (nextSelectedRowIds.length === 0) {
      void searchState.setRowEditor(null, null, { replace: false });
      return;
    }

    const resolvedActiveRowId =
      nextActiveRowId !== null && nextSelectedRowIds.includes(nextActiveRowId) === true
        ? nextActiveRowId
        : nextSelectedRowIds[0];
    if (resolvedActiveRowId === undefined) {
      return;
    }

    void searchState.setRowEditor("edit", resolvedActiveRowId, { replace: false });
  };

  const handleSelectedRowIdsChange = (nextSelectedRowIds: TableRowId[]) => {
    const newlySelectedRowId = nextSelectedRowIds.find(
      (rowId) => selectedRowIds.includes(rowId) === false,
    );
    const nextActiveRowId =
      newlySelectedRowId ??
      (activeRowId !== null && nextSelectedRowIds.includes(activeRowId) === true
        ? activeRowId
        : (nextSelectedRowIds[0] ?? null));

    openRows(nextSelectedRowIds, nextActiveRowId);
  };

  const handleRowSelectionRequest = ({
    checked,
    rowId,
    shiftKey,
  }: {
    checked: boolean;
    rowId: string;
    shiftKey: boolean;
  }) => {
    const nextSelection = updateRowSelection({
      anchorRowId: rowSelectionAnchorId,
      checked,
      rowIds: validRowIds,
      selectedRowIds: effectiveSelectedRowIds,
      shiftKey,
      targetRowId: rowId,
    });
    const nextActiveRowId =
      checked === true
        ? rowId
        : activeRowId !== null &&
            activeRowId !== rowId &&
            nextSelection.selectedRowIds.includes(activeRowId) === true
          ? activeRowId
          : getNearestSelectedRowId(validRowIds, nextSelection.selectedRowIds, rowId);

    setRowSelectionAnchorId(nextSelection.anchorRowId);
    openRows(nextSelection.selectedRowIds, nextActiveRowId);
  };

  const resetSelection = useCallback(() => {
    setSelectedRowIds([]);
    setRowSelectionAnchorId(null);
    setCellSelection(createEmptyCellSelection());
    setActiveColumnId(null);
    setCellPaneOpen(false);
  }, []);

  useEffect(() => {
    if (selectionScopeKeyRef.current === selectionScopeKey) {
      return;
    }

    selectionScopeKeyRef.current = selectionScopeKey;
    resetSelection();
  }, [resetSelection, selectionScopeKey]);

  const handleSortChange = (columnId: string, direction: "asc" | "desc") => {
    selectionScopeKeyRef.current = JSON.stringify({
      filters: searchState.filters,
      sortColumn: columnId,
      sortDirection: direction,
      tableKey,
    });
    resetSelection();
    void searchState.setSorting(columnId, direction);
  };

  const handleColumnVisibilityChange = (nextVisibility: Record<string, boolean>) => {
    visibility.setColumnVisibility(nextVisibility);
    if (cellSelection.selectedCells.some((cell) => nextVisibility[cell.columnId] === false)) {
      setCellSelection((currentSelection) => {
        const selectedCells = currentSelection.selectedCells.filter(
          (cell) => nextVisibility[cell.columnId] !== false,
        );
        const activeCell =
          currentSelection.activeCell !== null &&
          nextVisibility[currentSelection.activeCell.columnId] !== false
            ? currentSelection.activeCell
            : (selectedCells.at(-1) ?? null);
        const anchorCell =
          currentSelection.anchorCell !== null &&
          nextVisibility[currentSelection.anchorCell.columnId] !== false
            ? currentSelection.anchorCell
            : activeCell;

        return { activeCell, anchorCell, selectedCells };
      });
    }
    if (activeCell !== null && nextVisibility[activeCell.columnId] === false) {
      setCellPaneOpen(false);
    }
    if (activeColumnId !== null && nextVisibility[activeColumnId] === false) {
      setActiveColumnId(null);
    }
  };

  const table = useDataTable({
    columnOrder: order.columnOrder,
    rows: query.rows,
    columns: query.columns,
    sortColumn: searchState.sortColumn,
    sortDirection: searchState.sortDirection,
    selectedRowIds: visibleSelectedRowIds,
    columnVisibility: visibility.columnVisibility,
    onSortChange: handleSortChange,
    onSelectedRowIdsChange: handleSelectedRowIdsChange,
    onRowSelectionRequest: handleRowSelectionRequest,
    onColumnVisibilityChange: handleColumnVisibilityChange,
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

  const cellInspector = useMemo<DataViewCellInspectorState>(() => {
    if (activeCell === null) {
      return { columnPosition: null, rowPosition: null, rowValues: null, target: null };
    }

    const rowIndex = query.rows.findIndex((row) => String(row.id) === activeCell.rowId);
    const visibleDataColumns = table
      .getVisibleLeafColumns()
      .filter((column) => column.id !== "_select");
    const columnIndex = visibleDataColumns.findIndex((column) => column.id === activeCell.columnId);

    return {
      columnPosition: columnIndex >= 0 ? columnIndex : null,
      rowPosition: rowIndex >= 0 ? rowIndex : null,
      rowValues: rowIndex >= 0 ? (query.rows[rowIndex] ?? null) : null,
      target: activeCell,
    };
  }, [activeCell, order.columnOrder, query.rows, table, visibility.columnVisibility]);

  const closeDetailPane = () => {
    if (detailPaneMode === "cells") {
      setCellPaneOpen(false);
      return;
    }

    void searchState.setRowEditor(null, null, { replace: false });
  };

  const handleEscape = () => {
    if (detailPaneMode !== "closed") {
      closeDetailPane();
      return;
    }

    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      activeElement.closest('[data-slot="data-table-cell"]') !== null
    ) {
      activeElement.blur();
    }
    setCellSelection(createEmptyCellSelection());
    setActiveColumnId(null);
  };

  const openInsert = () => {
    setCellPaneOpen(false);
    void searchState.setRowEditor("insert", null, { replace: false });
  };

  const goToRowIndex = (nextActiveRowIndex: number) => {
    const nextActiveRowId = editedRowIds[nextActiveRowIndex] ?? null;
    if (nextActiveRowId === null) {
      return;
    }

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
          setSelectedRowIds(nextEditedRowIds);
          void searchState.setRowEditor("edit", nextActiveRowId, { replace: false });
        }
      : undefined;

  return {
    activeCell,
    activeColumnId,
    cellInspector,
    columnOrder: order.columnOrder,
    detailPaneMode,
    table,
    loadedRowCount: query.loadedRowCount,
    hasMore: query.hasMore,
    isFetchingMore: query.isFetchingMore,
    fetchMore: query.fetchMore,
    filters: searchState.filters,
    setFilters: async (filters) => {
      selectionScopeKeyRef.current = JSON.stringify({
        filters,
        sortColumn: searchState.sortColumn,
        sortDirection: searchState.sortDirection,
        tableKey,
      });
      resetSelection();
      await searchState.setFilters(filters);
    },
    setColumnOrder: order.setColumnOrder,
    schemaColumns,
    selectedCells: cellSelection.selectedCells,
    rowValues,
    rowEditor: {
      activeRowId: detailPaneMode === "rows" ? activeRowId : null,
      activeRowIndex,
      editedRowIds,
      goToNextRow,
      goToPreviousRow,
      openInsert,
    },
    handleCellActivate: (target, selectionMode) => {
      const visibleColumnIds = table
        .getVisibleLeafColumns()
        .map((column) => column.id)
        .filter((columnId) => columnId !== "_select");
      setCellSelection((currentSelection) =>
        updateCellSelection({
          anchorCell: currentSelection.anchorCell,
          columnIds: visibleColumnIds,
          mode: selectionMode,
          rowIds: validRowIds,
          selectedCells: currentSelection.selectedCells,
          target,
        }),
      );
      setActiveColumnId(null);
      if (detailPaneMode === "rows" && target.rowId === activeRowId) {
        requestAnimationFrame(() => {
          focusRowEditorField(target.columnId);
        });
      }
    },
    handleCellOpen: (target) => {
      const isOpenTarget =
        detailPaneMode === "cells" &&
        activeCell?.rowId === target.rowId &&
        activeCell.columnId === target.columnId &&
        cellSelection.selectedCells.length === 1;
      if (isOpenTarget === true) {
        const activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLElement &&
          activeElement.closest('[data-slot="data-table-cell"]') !== null
        ) {
          activeElement.blur();
        }
        setCellSelection(createEmptyCellSelection());
        setCellPaneOpen(false);
        return;
      }

      setCellSelection({ activeCell: target, anchorCell: target, selectedCells: [target] });
      setActiveColumnId(null);
      setCellPaneOpen(true);
      if (searchState.editorMode !== null) {
        void searchState.setRowEditor(null, null, { replace: false });
      }
    },
    handleEscape,
    handleColumnActivate: (columnId) => {
      if (columnId !== null) {
        setCellSelection(createEmptyCellSelection());
        setCellPaneOpen(false);
      }
      setActiveColumnId(columnId);
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

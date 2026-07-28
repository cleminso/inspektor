/**
 * Orchestrates the table query, selection, detail panes, row mutations, and draft transitions.
 *
 * URL search state owns query scope and row-editor identity. Local React state owns cell, column,
 * and checkbox selection. Row forms own field drafts. This hook connects those systems without
 * duplicating parsing, dirty comparison, or Jazz mutation rules.
 */
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
import { focusRowEditorField } from "@/components/table-explorer/data/rowEditorFocus";
import { useDataTable } from "@/components/table-explorer/data/useDataTable";
import { useDraftTransitionGuard } from "@/components/table-explorer/data/useDraftTransitionGuard";
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

export type DataViewDetailPaneMode = "closed" | "insert" | "rows";

interface InsertRowSaveOptions {
  keepOpen: boolean;
}

interface DataViewDraftTransitionState {
  discardAndContinue: () => void;
  isPending: boolean;
  isSaving: boolean;
  keepEditing: () => void;
}

interface UseDataViewStateResult {
  activeCell: DataTableCellTarget | null;
  activeColumnId: string | null;
  columnOrder: string[];
  detailPaneMode: DataViewDetailPaneMode;
  draftTransition: DataViewDraftTransitionState;
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
  handleColumnActivate: (columnId: string | null) => void;
  handleRowEditorOpenChange: (open: boolean) => void;
  handleRowEditorCancel: () => void;
  handleRowDraftDirtyChange: (isDirty: boolean) => void;
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

/**
 * Creates the empty source shape used to initialize an insert form.
 *
 * `undefined` means no value was supplied. `createInsertRowDraft` then decides from each descriptor
 * whether that field starts omitted, NULL, or as an empty required value.
 */
export function createInsertRowValues(schemaColumns: ColumnDescriptor[]): Record<string, unknown> {
  return Object.fromEntries(schemaColumns.map((column) => [column.name, undefined]));
}

function createEmptyCellSelection(): CellSelectionState {
  return { activeCell: null, anchorCell: null, selectedCells: [] };
}

/**
 * Builds the state and actions consumed by `DataView` for one runtime-selected Jazz table.
 *
 * Target-changing actions are closures passed to `useDraftTransitionGuard`. For example, selecting
 * row B while row A is dirty does not update selection or URL state immediately. The closure runs
 * only after Save and continue or Discard and continue. Selection changes around row A can proceed
 * because they do not replace the active draft target.
 */
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
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<TableRowId[]>(() =>
    activeRowId === null ? [] : [activeRowId],
  );
  const deletedRowIdsRef = useRef<Set<TableRowId>>(new Set());
  const [rowSelectionAnchorId, setRowSelectionAnchorId] = useState<TableRowId | null>(null);
  const mutations = useTableMutations(tableName);
  const draftTransition = useDraftTransitionGuard();
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

  const detailPaneMode: DataViewDetailPaneMode = editorMode === "edit" ? "rows" : editorMode;
  // Filters, sorting, connection, branch, schema, and table define one selection scope.
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
  useEffect(() => {
    const validRowIdSet = new Set(validRowIds);
    for (const deletedRowId of deletedRowIdsRef.current) {
      if (validRowIdSet.has(deletedRowId) === false) {
        deletedRowIdsRef.current.delete(deletedRowId);
      }
    }
  }, [validRowIds]);
  const visibleSelectedRowIds = useMemo(() => {
    const validRowIdSet = new Set(validRowIds);
    return effectiveSelectedRowIds.filter((rowId) => validRowIdSet.has(rowId) === true);
  }, [effectiveSelectedRowIds, validRowIds]);

  // Keep the edited row available when filtering or pagination removes it from the visible query.
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

  /**
   * Applies checkbox selection and chooses the one row whose draft is shown in the pane.
   *
   * Replacing insert mode or active row A with row B is guarded. Checking or unchecking other rows
   * while row A remains active does not disturb A's draft and therefore runs immediately.
   */
  const openRows = (nextSelectedRowIds: TableRowId[], nextActiveRowId: TableRowId | null) => {
    const requestedActiveRowId =
      nextActiveRowId !== null && nextSelectedRowIds.includes(nextActiveRowId) === true
        ? nextActiveRowId
        : nextSelectedRowIds[0];
    const transition = () => {
      const availableRowIds = nextSelectedRowIds.filter(
        (rowId) => deletedRowIdsRef.current.has(rowId) === false,
      );
      const resolvedActiveRowId =
        requestedActiveRowId !== undefined && availableRowIds.includes(requestedActiveRowId)
          ? requestedActiveRowId
          : availableRowIds[0];
      setSelectedRowIds(availableRowIds);
      setActiveColumnId(null);

      if (availableRowIds.length === 0) {
        void searchState.setRowEditor(null, null, { replace: false });
        return;
      }
      if (resolvedActiveRowId !== undefined) {
        void searchState.setRowEditor("edit", resolvedActiveRowId, { replace: false });
      }
    };
    const changesDraftTarget =
      searchState.editorMode === "insert" ||
      (searchState.editorMode === "edit" && requestedActiveRowId !== activeRowId);

    if (changesDraftTarget === true) {
      draftTransition.request(transition);
    } else {
      transition();
    }
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
  }, []);

  useEffect(() => {
    if (selectionScopeKeyRef.current === selectionScopeKey) {
      return;
    }

    // URL-driven scope changes invalidate row and cell positions from the preceding query.
    selectionScopeKeyRef.current = selectionScopeKey;
    resetSelection();
  }, [resetSelection, selectionScopeKey]);

  const handleSortChange = (columnId: string, direction: "asc" | "desc") => {
    draftTransition.request(() => {
      // Set the ref inside the guarded closure so Keep editing leaves selection and scope untouched.
      selectionScopeKeyRef.current = JSON.stringify({
        filters: searchState.filters,
        sortColumn: columnId,
        sortDirection: direction,
        tableKey,
      });
      resetSelection();
      void searchState.setSorting(columnId, direction);
    });
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

    // The dedicated row query is the fallback, not a second source for visible rows.
    return activeRows?.find((row) => String(row.id) === activeRowId) ?? null;
  }, [activeRowId, activeRows, query.rows]);
  const rowValues = useMemo(() => {
    if (searchState.editorMode === "insert") {
      return createInsertRowValues(schemaColumns);
    }

    return selectedRow;
  }, [schemaColumns, searchState.editorMode, selectedRow]);

  /** Closes presentation state without applying the stronger explicit-Cancel selection behavior. */
  const closeDetailPane = () => {
    void searchState.setRowEditor(null, null, { replace: false });
  };

  const handleEscape = () => {
    if (detailPaneMode !== "closed") {
      draftTransition.request(closeDetailPane);
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
    draftTransition.request(() => {
      void searchState.setRowEditor("insert", null, { replace: false });
    });
  };

  const goToRowIndex = (nextActiveRowIndex: number) => {
    const nextActiveRowId = editedRowIds[nextActiveRowIndex] ?? null;
    if (nextActiveRowId === null) {
      return;
    }

    draftTransition.request(() => {
      void searchState.setRowEditor("edit", nextActiveRowId, { replace: false });
    });
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

          const continued = await draftTransition.runMutation(() =>
            mutations.deleteRow(rowIdToDelete),
          );
          deletedRowIdsRef.current.add(rowIdToDelete);
          setSelectedRowIds((currentRowIds) =>
            currentRowIds.filter((rowId) => rowId !== rowIdToDelete),
          );
          if (continued === true) {
            // Save/Discard continuation owns the destination; do not also choose a neighboring row.
            return;
          }
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

  /**
   * Performs explicit form Cancel rather than guarded pane dismissal.
   *
   * Insert Cancel closes the pane. Edit Cancel discards the draft, unchecks the active row, and
   * focuses the nearest remaining checked row or closes the pane when none remain.
   */
  const handleRowEditorCancel = () => {
    draftTransition.clear();
    if (activeRowId === null) {
      closeDetailPane();
      return;
    }

    const nextSelectedRowIds = effectiveSelectedRowIds.filter((rowId) => rowId !== activeRowId);
    setSelectedRowIds(nextSelectedRowIds);
    const nextActiveRowId = getNearestSelectedRowId(validRowIds, nextSelectedRowIds, activeRowId);
    if (nextActiveRowId === null) {
      void searchState.setRowEditor(null, null, { replace: false });
      return;
    }
    void searchState.setRowEditor("edit", nextActiveRowId, { replace: false });
  };

  return {
    activeCell,
    activeColumnId,
    columnOrder: order.columnOrder,
    detailPaneMode,
    draftTransition,
    table,
    loadedRowCount: query.loadedRowCount,
    hasMore: query.hasMore,
    isFetchingMore: query.isFetchingMore,
    fetchMore: query.fetchMore,
    filters: searchState.filters,
    setFilters: async (filters) => {
      draftTransition.request(() => {
        // Keep the existing selection when the user rejects this guarded filter change.
        selectionScopeKeyRef.current = JSON.stringify({
          filters,
          sortColumn: searchState.sortColumn,
          sortDirection: searchState.sortDirection,
          tableKey,
        });
        resetSelection();
        void searchState.setFilters(filters);
      });
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
    handleEscape,
    handleColumnActivate: (columnId) => {
      if (columnId !== null) {
        setCellSelection(createEmptyCellSelection());
      }
      setActiveColumnId(columnId);
    },
    handleRowEditorOpenChange: (open) => {
      if (open === false) {
        draftTransition.request(closeDetailPane);
      }
    },
    handleRowDraftDirtyChange: draftTransition.handleDirtyChange,
    handleRowEditorCancel,
    handleDelete,
    handleEditSave: async (values) => {
      if (activeRowId !== null) {
        // Ordinary edit saves keep the pane open; live row reconciliation clears saved overlays.
        await draftTransition.runMutation(() => mutations.updateRow(activeRowId, values));
      }
    },
    handleInsertSave: async (values, options) => {
      const continued = await draftTransition.runMutation(() => mutations.insertRow(values));
      query.resetLoadedRows();

      if (continued === true) {
        // A pending destination replaces normal close or Insert more behavior.
        return;
      }

      if (options?.keepOpen === true) {
        return;
      }

      closeDetailPane();
    },
  };
}

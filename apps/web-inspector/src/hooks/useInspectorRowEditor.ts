/**
 * Coordinates the Inspector row detail panel.
 *
 * The panel can be closed, inserting a new Jazz row, or editing one row from the current
 * selection. The reducer keeps those modes mutually exclusive while preserving simple
 * next/previous navigation inside the editable selection.
 */
import { useMemo, useReducer } from "react";

import type { InspectorRowEditorMode, InspectorRowEditorState, TableRowId } from "@/types/tableExplorer";

interface UseInspectorRowEditorResult {
  activeRowId: TableRowId | null;
  activeRowIndex: number;
  close: () => void;
  editedRowIds: TableRowId[];
  goToNextRow: () => void;
  goToPreviousRow: () => void;
  isOpen: boolean;
  mode: InspectorRowEditorMode;
  openEdit: (rowIds: TableRowId[], activeRowIndex?: number) => void;
  openInsert: () => void;
  setActiveRowIndex: (index: number) => void;
}

type RowEditorAction =
  | { type: "close" }
  | { type: "openInsert" }
  | { type: "openEdit"; activeRowIndex: number; rowIds: TableRowId[] }
  | { type: "setActiveRowIndex"; index: number }
  | { type: "goToNextRow" }
  | { type: "goToPreviousRow" };

/** Keeps row navigation inside the currently editable selection. */
function clampActiveRowIndex(index: number, editedRowIds: TableRowId[]): number {
  if (editedRowIds.length === 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), editedRowIds.length - 1);
}

function rowEditorReducer(state: InspectorRowEditorState, action: RowEditorAction): InspectorRowEditorState {
  switch (action.type) {
    case "close": {
      return { kind: "closed" };
    }
    case "openInsert": {
      return { kind: "insert" };
    }
    case "openEdit": {
      if (action.rowIds.length === 0) {
        return { kind: "closed" };
      }

      return {
        kind: "edit",
        editedRowIds: action.rowIds,
        activeRowIndex: clampActiveRowIndex(action.activeRowIndex, action.rowIds),
      };
    }
    case "setActiveRowIndex": {
      if (state.kind !== "edit") {
        return state;
      }

      return {
        ...state,
        activeRowIndex: clampActiveRowIndex(action.index, state.editedRowIds),
      };
    }
    case "goToNextRow": {
      if (state.kind !== "edit") {
        return state;
      }

      return {
        ...state,
        activeRowIndex: clampActiveRowIndex(state.activeRowIndex + 1, state.editedRowIds),
      };
    }
    case "goToPreviousRow": {
      if (state.kind !== "edit") {
        return state;
      }

      return {
        ...state,
        activeRowIndex: clampActiveRowIndex(state.activeRowIndex - 1, state.editedRowIds),
      };
    }
  }
}

/** Provides table explorer components with row editor state and navigation actions. */
export function useInspectorRowEditor(): UseInspectorRowEditorResult {
  const [state, dispatch] = useReducer(rowEditorReducer, { kind: "closed" });

  const mode = state.kind;
  const editedRowIds = state.kind === "edit" ? state.editedRowIds : [];
  const activeRowIndex = state.kind === "edit" ? state.activeRowIndex : 0;

  const activeRowId = useMemo(() => {
    if (state.kind !== "edit") {
      return null;
    }

    return state.editedRowIds[state.activeRowIndex] ?? null;
  }, [state]);

  return {
    activeRowId,
    activeRowIndex,
    editedRowIds,
    mode,
    isOpen: mode !== "closed",
    openInsert: () => {
      dispatch({ type: "openInsert" });
    },
    openEdit: (rowIds, nextActiveRowIndex = 0) => {
      dispatch({ type: "openEdit", rowIds, activeRowIndex: nextActiveRowIndex });
    },
    close: () => {
      dispatch({ type: "close" });
    },
    goToNextRow: () => {
      dispatch({ type: "goToNextRow" });
    },
    goToPreviousRow: () => {
      dispatch({ type: "goToPreviousRow" });
    },
    setActiveRowIndex: (index) => {
      dispatch({ type: "setActiveRowIndex", index });
    },
  };
}

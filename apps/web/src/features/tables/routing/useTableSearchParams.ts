/**
 * Synchronizes data-explorer UI state with the table route search params.
 *
 * Filters, sorting, selected row editor mode, and schema/data view are encoded in the URL
 * so Inspector links can restore a specific view into a Jazz table.
 */
import { useMemo } from "react";

import { useNavigate, useSearch } from "@tanstack/react-router";

import {
  parseFiltersFromSearchParam,
  serializeFiltersToSearchParam,
} from "@tables/filters/filterParsing";
import type { TableFilterClause } from "@tables/filters/tableFilters";
import type {
  DetailPaneMode,
  TableExplorerSearchState,
  TableExplorerView,
  TableRowId,
  TableSortDirection,
} from "@tables/tableTypes";

interface SearchValues {
  dir?: string;
  filters?: string;
  mode?: string | null;
  rowId?: string | null;
  sort?: string;
  tab?: string;
  view?: string;
}

interface UpdateSearchOptions {
  replace?: boolean;
}

/** Parsed table explorer URL state plus setters that write back to route search params. */
export interface UseTableExplorerSearchParamsResult extends TableExplorerSearchState {
  openSchema: () => Promise<void>;
  setFilters: (filters: TableFilterClause[]) => Promise<void>;
  setRowEditor: (
    mode: DetailPaneMode | null,
    rowId?: TableRowId | null,
    options?: UpdateSearchOptions,
  ) => Promise<void>;
  setSorting: (sortColumn: string, sortDirection: TableSortDirection) => Promise<void>;
}

function parseView(value: string | undefined): TableExplorerView {
  return value === "schema" ? "schema" : "data";
}

function parseSortDirection(value: string | undefined): TableSortDirection {
  return value === "desc" ? "desc" : "asc";
}

function parseEditorMode(value: string | null | undefined): DetailPaneMode | null {
  if (value === "edit" || value === "insert") {
    return value;
  }

  return null;
}

function parseRowId(value: string | null | undefined): TableRowId | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

/**
 * Provides typed accessors for table explorer route search state.
 *
 * The Inspector keeps filters, sorting, row editor mode, and schema/data view in the URL so
 * links reopen the same table context without storing this transient state in Jazz.
 */
export function useTableExplorerSearchParams(): UseTableExplorerSearchParamsResult {
  const navigate = useNavigate({ from: "/conn/$connectionId/tables/$tableName/" });
  const search = useSearch({ strict: false }) as SearchValues;

  /**
   * Why: the parsed filters array flows into useTableRows's query-builder memo and
   * useTableViewState's selection-scope key. When parsing lived inside the combined state
   * memo below, any unrelated search change — opening the row editor flips `mode`/`rowId`,
   * switching views flips `view` — re-ran the parse and produced a fresh array identity for
   * identical filter content, which rebuilt the generic query and added identity noise that
   * downstream stringified comparison keys then had to absorb.
   *
   * How: a dedicated memo keyed on the raw serialized string re-parses only when the filter
   * content actually changes. React compares the string by value, so the array identity now
   * follows filter content instead of following every URL update.
   *
   * What: downstream memos and effects re-run only on semantic filter changes. Opening or
   * closing the row editor and switching views no longer rebuild the query builder, which
   * removes the wasted query churn and shrinks what downstream comparison keys must defend
   * against at this boundary.
   */
  const filters = useMemo(
    () => parseFiltersFromSearchParam(search.filters ?? null),
    [search.filters],
  );

  const state = useMemo<TableExplorerSearchState>(() => {
    const editorMode = parseEditorMode(search.mode);
    const rowId = parseRowId(search.rowId);
    // Edit mode requires a stable Jazz row ID; invalid URLs fall back to the data table.
    const resolvedEditorMode = editorMode === "edit" && rowId === null ? null : editorMode;

    return {
      editorMode: resolvedEditorMode,
      // Opening the row editor always returns the user to data rows, even from schema view.
      view: resolvedEditorMode !== null ? "data" : parseView(search.view),
      filters,
      rowId: resolvedEditorMode === "edit" ? rowId : null,
      sortColumn: search.sort ?? "id",
      sortDirection: parseSortDirection(search.dir),
    };
  }, [filters, search.dir, search.mode, search.rowId, search.sort, search.view]);

  const createNextSearch = (
    baseSearch: SearchValues,
    updates: Partial<SearchValues>,
  ): SearchValues => {
    const nextSearch: SearchValues = {
      ...baseSearch,
      ...updates,
    };

    // Remove default values so generated URLs stay readable and shareable.
    delete nextSearch.tab;
    if (nextSearch.view === "data" || nextSearch.view === undefined) {
      delete nextSearch.view;
    }
    if (nextSearch.sort === "id" || nextSearch.sort === undefined) {
      delete nextSearch.sort;
    }
    if (nextSearch.dir === "asc" || nextSearch.dir === undefined) {
      delete nextSearch.dir;
    }
    if (nextSearch.filters === null || nextSearch.filters === undefined) {
      delete nextSearch.filters;
    }
    if (nextSearch.mode !== "edit" && nextSearch.mode !== "insert") {
      delete nextSearch.mode;
      delete nextSearch.rowId;
    }
    if (nextSearch.mode === "insert") {
      delete nextSearch.rowId;
    }
    if (nextSearch.mode === "edit") {
      const rowId = parseRowId(nextSearch.rowId);
      if (rowId === null) {
        delete nextSearch.mode;
        delete nextSearch.rowId;
      } else {
        nextSearch.rowId = rowId;
      }
    }

    return nextSearch;
  };

  const updateSearch = async (
    updates: Partial<SearchValues>,
    options?: UpdateSearchOptions,
  ): Promise<void> => {
    await navigate({
      replace: options?.replace ?? true,
      search: (currentSearch) => createNextSearch(currentSearch as SearchValues, updates),
    });
  };

  return {
    ...state,
    openSchema: async () => {
      await updateSearch({ mode: null, rowId: null, view: "schema" });
    },
    setFilters: async (filters) => {
      await updateSearch({
        filters: serializeFiltersToSearchParam(filters) ?? undefined,
        mode: null,
        rowId: null,
      });
    },
    setRowEditor: async (mode, rowId = null, options) => {
      if (mode === "edit") {
        await updateSearch({ mode, rowId }, options);
        return;
      }

      if (mode === "insert") {
        await updateSearch({ mode, rowId: null, view: "data" }, options);
        return;
      }

      await updateSearch({ mode: null, rowId: null }, options);
    },
    setSorting: async (sortColumn, sortDirection) => {
      await updateSearch({ sort: sortColumn, dir: sortDirection, mode: null, rowId: null });
    },
  };
}

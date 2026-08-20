import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ColumnDescriptor, DynamicTableRow } from "jazz-tools";
import { Box, Button, Command, DataGridFilterClause, DatePicker, Field, Text } from "@inspector/ds";

import {
  applyFilterDraft,
  backspaceFilterDraft,
  createFilterDraft,
  createFilterRenderKeys,
  editFilterDraft,
  resolveFilterDraftIndex,
  selectFilterColumn,
  selectFilterOperator,
  setFilterDraftTokens,
  setFilterDraftValue,
  validateFilterDraft,
  type FilterDraft,
} from "./filterDraft";
import {
  getFilterOperatorsForColumn,
  parseFilterTokens,
  parseFilterValue,
  tokenizePastedFilterValues,
} from "./filterParsing";
import type { TableFilterClause, TableFilterOperator } from "./tableFilters";

interface DataGridFilterBuilderProps {
  columns: readonly ColumnDescriptor[];
  filters: readonly TableFilterClause[];
  rows?: readonly DynamicTableRow[];
  onFiltersChange: (filters: TableFilterClause[]) => void | Promise<void>;
}

type ColumnOption = { label: string; description: string; keywords: string[]; column: ColumnDescriptor };
type OperatorOption = {
  label: string;
  description?: string;
  keywords: string[];
  operator: TableFilterOperator;
  code: TableFilterOperator;
  nullValue?: boolean;
};
type ValueOption = { label: string; keywords: string[]; value: string; action?: "pickDate" };
type StageOption = ColumnOption | OperatorOption | ValueOption;
type StagedDraft = { key: string; draft: FilterDraft };
type PendingRemovalFocus = { filterCount: number; targetKey: string | null };

const operatorLabels: Record<TableFilterOperator, string> = {
  eq: "Equals",
  ne: "Does not equal",
  gt: "Is greater than",
  gte: "Is greater than or equal to",
  lt: "Is less than",
  lte: "Is less than or equal to",
  contains: "Contains",
  in: "Is any of",
  isNull: "Is null",
};

const operatorSymbols: Record<TableFilterOperator, string> = {
  eq: "=",
  ne: "!=",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  contains: "contains",
  in: "in",
  isNull: "is null",
};

const operatorKeywords: Record<TableFilterOperator, string[]> = {
  eq: ["eq", "equal", "equals", "=", "==", "==="],
  ne: ["ne", "not equal", "does not equal", "!=", "!==", "<>"],
  gt: ["gt", "greater than", ">"],
  gte: ["gte", "greater than or equal", ">=", "≥"],
  lt: ["lt", "less than", "<"],
  lte: ["lte", "less than or equal", "<=", "≤"],
  contains: ["contains", "includes", "⊃"],
  in: ["in", "any of", "∈"],
  isNull: ["null", "empty", "∅"],
};

const visibleColumnTypes = new Set([
  "Text",
  "Uuid",
  "Integer",
  "BigInt",
  "Double",
  "Timestamp",
  "Enum",
  "Boolean",
]);

const idColumn = {
  name: "id",
  column_type: { type: "Uuid" },
  nullable: false,
} as ColumnDescriptor;

function getVisibleColumns(columns: readonly ColumnDescriptor[]): ColumnDescriptor[] {
  return [idColumn, ...columns].filter((column) => visibleColumnTypes.has(column.column_type.type));
}

function getColumnTypeLabel(column: ColumnDescriptor): string {
  return column.column_type.type === "Uuid" ? "UUID" : column.column_type.type;
}

function getOperatorOptions(column: ColumnDescriptor): OperatorOption[] {
  const options: OperatorOption[] = [];
  for (const operator of getFilterOperatorsForColumn(column)) {
    if (operator === "in" && ["Array", "Json", "Bytea"].includes(column.column_type.type)) continue;
    if (operator === "isNull") {
      options.push(
        { label: "Is null", keywords: operatorKeywords.isNull, operator, code: operator, nullValue: true },
        { label: "Is not null", keywords: ["not null", "present", "!∅"], operator, code: operator, nullValue: false },
      );
    } else {
      options.push({
        label: operatorLabels[operator],
        keywords: operatorKeywords[operator],
        operator,
        code: operator,
      });
    }
  }
  return options;
}

const timestampComparisonOperators = new Set<TableFilterOperator>(["eq", "ne", "gt", "gte", "lt", "lte"]);

function getStartOfDay(dayOffset: number): number {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date.getTime();
}

function formatDateValue(value: unknown): string {
  const numericValue = typeof value === "number" ? value : Number(value);
  const date = Number.isFinite(numericValue) === true
    ? new Date(numericValue)
    : new Date(String(value));
  if (Number.isFinite(date.getTime()) === false) return String(value);
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getValueOptions(
  column: ColumnDescriptor,
  operator: TableFilterOperator | null | undefined,
  rows: readonly DynamicTableRow[],
): ValueOption[] {
  if (operator === "in") return [];
  if (column.column_type.type === "Boolean") {
    return [
      { label: "True", keywords: ["true", "yes"], value: "true" },
      { label: "False", keywords: ["false", "no"], value: "false" },
    ];
  }
  if (column.column_type.type === "Enum") {
    return column.column_type.variants.map((value) => ({ label: value, keywords: [value], value }));
  }
  if (
    column.column_type.type === "Timestamp" &&
    operator !== null &&
    operator !== undefined &&
    timestampComparisonOperators.has(operator)
  ) {
    const options: ValueOption[] = [
      { label: "Today", keywords: ["today", "now"], value: String(getStartOfDay(0)) },
      { label: "Yesterday", keywords: ["yesterday"], value: String(getStartOfDay(-1)) },
    ];
    if (["gt", "gte", "lt", "lte"].includes(operator)) {
      options.push(
        { label: "7 days ago", keywords: ["week", "seven days"], value: String(getStartOfDay(-7)) },
        { label: "30 days ago", keywords: ["month", "thirty days"], value: String(getStartOfDay(-30)) },
      );
    }
    options.push({
      label: "Pick a date…",
      keywords: ["pick a date", "calendar", "date"],
      value: "",
      action: "pickDate",
    });
    return options;
  }
  const uniqueValues = new Map<string, ValueOption>();
  for (const row of rows) {
    const value = row[column.name];
    if (
      value === null ||
      value === undefined ||
      (typeof value !== "string" && typeof value !== "number" && typeof value !== "bigint")
    ) {
      continue;
    }
    const label = String(value);
    if (uniqueValues.has(label) === false) {
      uniqueValues.set(label, { label, keywords: [label], value: label });
    }
    if (uniqueValues.size === 50) break;
  }
  return [...uniqueValues.values()];
}

function summarizeValue(value: unknown, column?: ColumnDescriptor): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  if (value === null) return "NULL";
  if (column?.column_type.type === "Timestamp") return formatDateValue(value);
  return String(value);
}

function summarizeDraftValue(draft: FilterDraft): string {
  if (draft.operator === "in") return draft.tokens.join(", ");
  if (draft.operator === "isNull") return draft.rawValue === "true" ? "NULL" : "not NULL";
  return summarizeValue(draft.rawValue, draft.column ?? undefined);
}

function getClauseIssue(
  clause: TableFilterClause,
  columns: readonly ColumnDescriptor[],
): string | null {
  const column = getVisibleColumns(columns).find((candidate) => candidate.name === clause.column);
  if (column === undefined) return "Column no longer exists.";
  if (getFilterOperatorsForColumn(column).includes(clause.operator) === false) {
    return "Operator is no longer supported.";
  }
  try {
    if (clause.operator === "in") {
      if (Array.isArray(clause.value) === false) return "Value must be a list.";
      parseFilterTokens(column, clause.value.map((value) => String(value)));
    } else if (clause.operator === "isNull") {
      if (typeof clause.value !== "boolean") return "Null check is invalid.";
    } else {
      parseFilterValue(column, clause.operator, String(clause.value));
    }
  } catch {
    return "Value no longer matches the column type.";
  }
  return null;
}

export function DataGridFilterBuilder({
  columns,
  filters,
  rows = [],
  onFiltersChange,
}: DataGridFilterBuilderProps): React.ReactElement {
  const [draft, setDraft] = useState<FilterDraft | null>(null);
  const [query, setQuery] = useState("");
  const [issue, setIssue] = useState<string | null>(null);
  const [isUpdatingFilters, setIsUpdatingFilters] = useState(false);
  const [updateIssue, setUpdateIssue] = useState<string | null>(null);
  const [stagedDrafts, setStagedDrafts] = useState<StagedDraft[]>([]);
  const rootButtonRef = useRef<HTMLElement>(null);
  const appliedFiltersRef = useRef<HTMLDivElement>(null);
  const clauseRootRefs = useRef<Array<HTMLDivElement | null>>([]);
  const clauseTriggerRefs = useRef<Array<HTMLElement | null>>([]);
  const draftChipRef = useRef<HTMLElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const dialogReturnFocusRef = useRef<HTMLElement | null>(null);
  const pendingRemovalFocusRef = useRef<PendingRemovalFocus | null>(null);
  const visibleColumns = getVisibleColumns(columns);
  const renderKeys = useMemo(() => createFilterRenderKeys(filters), [filters]);

  useLayoutEffect(() => {
    const pendingFocus = pendingRemovalFocusRef.current;
    if (pendingFocus === null || pendingFocus.filterCount !== filters.length) return;

    if (pendingFocus.targetKey === null) {
      if (filters.length !== 0) return;
      pendingRemovalFocusRef.current = null;
      rootButtonRef.current?.focus();
      return;
    }

    const targetIndex = renderKeys.indexOf(pendingFocus.targetKey);
    if (targetIndex < 0) return;
    pendingRemovalFocusRef.current = null;
    clauseRootRefs.current[targetIndex]?.focus();
  }, [filters.length, renderKeys]);

  function openDraft(nextDraft: FilterDraft, returnFocus: HTMLElement | null) {
    dialogReturnFocusRef.current = returnFocus;
    setStagedDrafts([]);
    setDraft(nextDraft);
    setQuery("");
    setIssue(null);
  }

  function closeDraft() {
    setStagedDrafts([]);
    setDraft(null);
    setQuery("");
    setIssue(null);
  }

  function stageDraft(nextDraft: FilterDraft) {
    const nextIssue = validateFilterDraft(nextDraft);
    if (nextIssue !== null) {
      setIssue(nextIssue);
      return false;
    }
    setStagedDrafts((current) => [
      ...current,
      { key: crypto.randomUUID(), draft: nextDraft },
    ]);
    setDraft(createFilterDraft());
    setQuery("");
    setIssue(null);
    return true;
  }

  async function applyStagedDrafts() {
    if (isUpdatingFilters === true) return;
    let nextFilters = [...filters];
    for (const stagedDraft of stagedDrafts) {
      const result = applyFilterDraft(stagedDraft.draft, nextFilters);
      if ("issue" in result) {
        setIssue(result.issue);
        return;
      }
      nextFilters = result.filters;
    }
    try {
      setIsUpdatingFilters(true);
      setUpdateIssue(null);
      await onFiltersChange(nextFilters);
      closeDraft();
    } catch (error) {
      setIssue(error instanceof Error ? error.message : "Filters could not be applied.");
    } finally {
      setIsUpdatingFilters(false);
    }
  }

  function editStagedDraft(key: string) {
    const stagedDraft = stagedDrafts.find((candidate) => candidate.key === key);
    if (stagedDraft === undefined) return;
    setStagedDrafts((current) => current.filter((candidate) => candidate.key !== key));
    setDraft(stagedDraft.draft);
    setQuery("");
    setIssue(null);
  }

  function removeStagedDraft(key: string) {
    draftInputRef.current?.focus();
    setStagedDrafts((current) => current.filter((candidate) => candidate.key !== key));
  }

  function updateValue(nextDraft: FilterDraft) {
    setDraft(nextDraft);
    if (issue !== null) {
      setIssue(validateFilterDraft(nextDraft));
    }
  }

  function editDraftColumn() {
    if (draft === null) return;
    setDraft({ ...draft, stage: "column", column: null, operator: null, rawValue: "", tokens: [] });
    setQuery("");
    setIssue(null);
  }

  async function removeFilter(filter: TableFilterClause, fallbackIndex: number) {
    if (isUpdatingFilters === true) return;
    const identityIndex = filters.findIndex((candidate) => candidate === filter);
    const matchingIndex = filters[fallbackIndex]?.id === filter.id
      ? fallbackIndex
      : filters.findIndex((candidate) => candidate.id === filter.id);
    const index = identityIndex >= 0 ? identityIndex : matchingIndex;
    if (index < 0) return;
    const nextFilters = filters.filter((_, candidateIndex) => candidateIndex !== index);
    const nextTargetIndex = Math.min(index, nextFilters.length - 1);
    pendingRemovalFocusRef.current = {
      filterCount: nextFilters.length,
      targetKey: nextTargetIndex < 0 ? null : createFilterRenderKeys(nextFilters)[nextTargetIndex] ?? null,
    };
    try {
      setIsUpdatingFilters(true);
      setUpdateIssue(null);
      await onFiltersChange(nextFilters);
    } catch (error) {
      pendingRemovalFocusRef.current = null;
      setUpdateIssue(error instanceof Error ? error.message : "Filters could not be updated.");
    } finally {
      setIsUpdatingFilters(false);
    }
  }

  function openEdit(index: number, stage: FilterDraft["stage"]) {
    const clause = filters[index];
    if (clause === undefined) return;
    const column = visibleColumns.find((candidate) => candidate.name === clause.column) ?? null;
    openDraft(editFilterDraft(clause, index, stage, column), clauseTriggerRefs.current[index]);
  }

  function removeDraftFilter() {
    if (draft === null) return;
    const index = resolveFilterDraftIndex(draft, filters);
    if (index === null) return;
    const filter = filters[index];
    if (filter !== undefined) void removeFilter(filter, index);
  }

  const columnOptions: ColumnOption[] = visibleColumns.map((column) => ({
    label: column.name,
    description: getColumnTypeLabel(column),
    keywords: [column.name, getColumnTypeLabel(column)],
    column,
  }));
  const operatorOptions = draft?.column === null || draft?.column === undefined ? [] : getOperatorOptions(draft.column);
  const valueOptions = useMemo(
    () => draft?.column === null || draft?.column === undefined
      ? []
      : getValueOptions(draft.column, draft.operator, rows),
    [draft?.column, draft?.operator, rows],
  );
  const stageItems: StageOption[] = draft?.stage === "column"
    ? columnOptions
    : draft?.stage === "operator"
      ? operatorOptions
      : draft?.stage === "value"
        ? valueOptions
        : [];
  const usesListValue =
    draft?.stage === "value" &&
    (draft.column?.column_type.type === "Boolean" || draft.column?.column_type.type === "Enum") &&
    draft.operator !== "in";
  const showsCalendar = draft?.stage === "date";
  const rootAction = (
    <Box flexShrink={0}>
      <Button
        ref={rootButtonRef}
        aria-haspopup="dialog"
        disabled={isUpdatingFilters}
        layout="row"
        size="s"
        variant="ghost"
        onClick={() => openDraft(createFilterDraft(), rootButtonRef.current)}
        onKeyDown={(event) => {
          if (event.key !== "Backspace" || filters.length === 0) return;
          event.preventDefault();
          clauseRootRefs.current[filters.length - 1]?.focus();
        }}
      >
        <Text as="span" color="muted" variant="caption">
          {filters.length === 0 ? "Filter table" : "Add more filters"}
        </Text>
      </Button>
    </Box>
  );

  return (
    <>
      <Box alignItems="center" aria-label="Table filters" gap="xs" minWidth={0} role="toolbar" width="full">
        {filters.length === 0 ? rootAction : (
          <>
            <DataGridFilterClause.List
              ref={appliedFiltersRef}
              aria-keyshortcuts="Backspace Escape"
              aria-label="Applied table filters"
              role="group"
              tabIndex={0}
              onClick={(event) => {
                if (event.target === event.currentTarget) event.currentTarget.focus();
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget || event.key !== "Backspace") return;
                event.preventDefault();
                clauseRootRefs.current[filters.length - 1]?.focus();
              }}
            >
              {filters.map((filter, index) => {
                const filterColumn = visibleColumns.find((column) => column.name === filter.column);
                const clauseIssue = getClauseIssue(filter, columns);
                const operatorLabel =
                  filter.operator === "isNull"
                    ? filter.value === true
                      ? "is null"
                      : "is not null"
                    : operatorLabels[filter.operator].toLocaleLowerCase();
                const clauseValue = summarizeValue(filter.value, filterColumn);
                const valueLabel = filter.operator === "isNull" ? "" : ` ${clauseValue}`;
                const clauseLabel = `Filter ${filter.column} ${operatorLabel}${valueLabel}`;
                const operatorSymbol = filter.operator === "isNull"
                  ? filter.value === true ? "is null" : "is not null"
                  : operatorSymbols[filter.operator];
                const editStage = clauseIssue === "Column no longer exists."
                  ? "column"
                  : clauseIssue === "Operator is no longer supported." || filter.operator === "isNull"
                    ? "operator"
                    : "value";
                return (
                  <DataGridFilterClause.Root
                    ref={(node) => { clauseRootRefs.current[index] = node; }}
                    key={renderKeys[index]}
                    aria-label={clauseLabel}
                    disabled={isUpdatingFilters}
                    invalid={clauseIssue !== null}
                    invalidDescription={clauseIssue ?? undefined}
                    role="group"
                    tabIndex={-1}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Escape") {
                        event.preventDefault();
                        appliedFiltersRef.current?.focus();
                        return;
                      }
                      if (event.key !== "Backspace" && event.key !== "Delete") return;
                      event.preventDefault();
                      void removeFilter(filter, index);
                    }}
                  >
                    <DataGridFilterClause.Trigger
                      ref={(node) => { clauseTriggerRefs.current[index] = node; }}
                      aria-label={`${clauseIssue === null ? "Edit" : "Repair"} ${clauseLabel.charAt(0).toLocaleLowerCase()}${clauseLabel.slice(1)}`}
                      onClick={() => openEdit(index, editStage)}
                      onKeyDown={(event) => {
                        if (event.key !== "Backspace" && event.key !== "Delete") return;
                        event.preventDefault();
                        void removeFilter(filter, index);
                      }}
                    >
                      <DataGridFilterClause.Column>{filter.column}</DataGridFilterClause.Column>
                      <DataGridFilterClause.Operator>{operatorSymbol}</DataGridFilterClause.Operator>
                      {filter.operator === "isNull" ? null : (
                        <DataGridFilterClause.Value>{clauseValue}</DataGridFilterClause.Value>
                      )}
                    </DataGridFilterClause.Trigger>
                    <DataGridFilterClause.Remove
                      aria-label={`Remove ${clauseLabel.charAt(0).toLocaleLowerCase()}${clauseLabel.slice(1)}`}
                      onClick={() => { void removeFilter(filter, index); }}
                    />
                  </DataGridFilterClause.Root>
                );
              })}
            </DataGridFilterClause.List>
            {rootAction}
          </>
        )}
      </Box>
      {updateIssue === null ? null : (
        <Text color="error" role="alert" variant="caption">{updateIssue}</Text>
      )}

      <Command.Dialog
        finalFocus={dialogReturnFocusRef}
        open={draft !== null}
        onOpenChange={(open) => { if (open === false) closeDraft(); }}
      >
        <Command.Title>
          {draft?.stage === "column"
            ? "Choose a column"
            : draft?.stage === "operator"
              ? "Choose an operator"
              : draft?.stage === "date"
                ? "Pick a date"
                : "Enter a value"}
        </Command.Title>
        {draft === null ? null : (
          <Command.Root
            key={`${draft.stage}:${draft.column?.name ?? "none"}:${draft.operator ?? "none"}`}
            autoHighlight={
              draft.stage === "column" && stagedDrafts.length > 0 && query.length === 0
                ? false
                : true
            }
            items={stageItems}
            inputValue={usesListValue === true || draft.stage !== "value" ? query : draft.rawValue}
            itemToStringLabel={(item) => item.label}
            onInputValueChange={(nextValue) => {
              if (draft.stage === "value" && usesListValue === false) {
                updateValue(setFilterDraftValue(draft, nextValue));
              } else {
                setQuery(nextValue);
              }
            }}
          >
            <Command.InputRow aria-label="Filter draft">
              {stagedDrafts.map((stagedDraft) => {
                const stagedColumn = stagedDraft.draft.column;
                const stagedOperator = stagedDraft.draft.operator;
                if (stagedColumn === null || stagedOperator === null) return null;
                const stagedValue = summarizeDraftValue(stagedDraft.draft);
                const isNullDraft = stagedOperator === "isNull";
                const stagedOperatorLabel = isNullDraft
                  ? stagedDraft.draft.rawValue === "true" ? "is null" : "is not null"
                  : operatorLabels[stagedOperator].toLocaleLowerCase();
                const stagedLabel = `draft filter ${stagedColumn.name} ${stagedOperatorLabel}${isNullDraft ? "" : ` ${stagedValue}`}`;
                return (
                  <DataGridFilterClause.Root key={stagedDraft.key}>
                    <DataGridFilterClause.Trigger
                      aria-label={`Edit ${stagedLabel}`}
                      onClick={() => editStagedDraft(stagedDraft.key)}
                    >
                      <DataGridFilterClause.Column>{stagedColumn.name}</DataGridFilterClause.Column>
                      <DataGridFilterClause.Operator>
                        {isNullDraft ? stagedOperatorLabel : operatorSymbols[stagedOperator]}
                      </DataGridFilterClause.Operator>
                      {isNullDraft ? null : <DataGridFilterClause.Value>{stagedValue}</DataGridFilterClause.Value>}
                    </DataGridFilterClause.Trigger>
                    <DataGridFilterClause.Remove
                      aria-label={`Remove ${stagedLabel}`}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => removeStagedDraft(stagedDraft.key)}
                    />
                  </DataGridFilterClause.Root>
                );
              })}
              {draft.stage === "operator" && draft.column !== null ? (
                <Text as="span" variant="body">{draft.column.name}</Text>
              ) : null}
              {draft.column === null || draft.operator === null ? null : (
                <Button
                  ref={draftChipRef}
                  aria-label={`Edit filter ${draft.column.name} ${operatorLabels[draft.operator].toLocaleLowerCase()}`}
                  size="s"
                  variant="secondary"
                  onClick={editDraftColumn}
                  onKeyDown={(event) => {
                    if (event.key !== "Backspace" && event.key !== "Delete") return;
                    event.preventDefault();
                    editDraftColumn();
                  }}
                >
                  {draft.column.name} {operatorSymbols[draft.operator]}
                </Button>
              )}
              {draft.stage !== "column" && draft.stage !== "operator" ? null : (
                <Command.Input
                  ref={draftInputRef}
                  aria-label={draft.stage === "column" ? "Filter columns" : "Filter operators"}
                  aria-describedby={issue === null ? undefined : "filter-value-error"}
                  aria-invalid={issue === null ? undefined : true}
                  autoComplete="off"
                  // oxlint-disable-next-line jsx-a11y/no-autofocus -- The modal keeps its staged query input focused after each selection.
                  autoFocus
                  placeholder={
                    stagedDrafts.length > 0
                      ? undefined
                      : draft.stage === "column"
                        ? "Search columns"
                        : "Type an operator"
                  }
                  spellCheck={false}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      draft.stage === "column" &&
                      query.length === 0 &&
                      stagedDrafts.length > 0 &&
                      event.currentTarget.getAttribute("aria-activedescendant") === null
                    ) {
                      event.preventDefault();
                      event.stopPropagation();
                      void applyStagedDrafts();
                    } else if (event.key === "Backspace" && query.length === 0) {
                      const lastStagedDraft = stagedDrafts[stagedDrafts.length - 1];
                      const draftIsEmpty = draft.column === null && draft.operator === null && draft.rawValue.length === 0 && draft.tokens.length === 0;
                      if (draftIsEmpty === true && lastStagedDraft !== undefined) {
                        event.preventDefault();
                        removeStagedDraft(lastStagedDraft.key);
                        return;
                      }
                      const result = backspaceFilterDraft(draft);
                      if (result.action === "cancel") closeDraft();
                      else if (result.action === "remove") {
                        removeDraftFilter();
                        closeDraft();
                      } else setDraft(result.draft);
                    }
                  }}
                />
              )}
            </Command.InputRow>
            {draft.stage !== "value" ? null : (
              <Command.Input
                ref={draftInputRef}
                aria-label="Filter value"
                aria-describedby={issue === null ? undefined : "filter-value-error"}
                aria-invalid={issue === null ? undefined : true}
                autoComplete="off"
                // oxlint-disable-next-line jsx-a11y/no-autofocus -- The modal moves focus to value entry after operator selection.
                autoFocus
                divider={stageItems.length === 0 ? "none" : "bottom"}
                placeholder="Enter a value"
                spellCheck={false}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    usesListValue === false &&
                    event.currentTarget.getAttribute("aria-activedescendant") === null
                  ) {
                    event.preventDefault();
                    if (draft.operator === "in" && draft.rawValue.trim().length > 0) {
                      const nextDraft = setFilterDraftTokens(draft, [...draft.tokens, draft.rawValue.trim()]);
                      stageDraft({ ...nextDraft, rawValue: "" });
                    } else {
                      stageDraft(draft);
                    }
                  } else if (event.key === "Backspace" && draft.rawValue.length === 0) {
                    if (draft.tokens.length === 0 && draft.column !== null && draft.operator !== null) {
                      event.preventDefault();
                      draftChipRef.current?.focus();
                      return;
                    }
                    const result = backspaceFilterDraft(draft);
                    if (result.action === "cancel") closeDraft();
                    else if (result.action === "remove") {
                      removeDraftFilter();
                      closeDraft();
                    } else setDraft(result.draft);
                  }
                }}
                onPaste={(event) => {
                  if (draft.operator !== "in") return;
                  const pastedTokens = tokenizePastedFilterValues(event.clipboardData.getData("text"));
                  if (pastedTokens.length <= 1) return;
                  event.preventDefault();
                  updateValue(setFilterDraftTokens(draft, [...draft.tokens, ...pastedTokens]));
                }}
              />
            )}
            {draft.stage === "date" || (draft.stage === "value" && stageItems.length === 0) ? null : (
              <Command.List>
                {stageItems.length === 0 ? null : <Command.Empty>No matches found.</Command.Empty>}
                <Command.Group>
                  {draft.stage === "value" ? null : (
                    <Command.GroupLabel>
                      {draft.stage === "column" ? "Columns" : "Operators"}
                    </Command.GroupLabel>
                  )}
                  {stageItems.map((item) => (
                    <Command.Item
                      key={`${item.label}:${"operator" in item ? item.nullValue ?? "" : "value" in item ? item.value : item.column.name}`}
                      value={item}
                      onClick={() => {
                        if (draft.stage === "column" && "column" in item) {
                          setDraft(selectFilterColumn(draft, item.column));
                        } else if (draft.stage === "operator" && "operator" in item) {
                          const nextDraft = selectFilterOperator(draft, item.operator);
                          if (item.operator === "isNull") {
                            stageDraft(setFilterDraftValue(nextDraft, String(item.nullValue)));
                          } else setDraft(nextDraft);
                        } else if (draft.stage === "value" && "value" in item) {
                          if (item.action === "pickDate") {
                            setDraft({ ...draft, rawValue: "", stage: "date" });
                          } else {
                            stageDraft(setFilterDraftValue(draft, item.value));
                          }
                        }
                        setQuery("");
                      }}
                    >
                      <Command.ItemText
                        data-testid={"column" in item ? `command-item-text-${item.column.name}` : undefined}
                        label={item.label}
                        description={"description" in item ? item.description : undefined}
                        layout={"column" in item ? "inline" : "stacked"}
                      />
                      {"code" in item ? <Command.Shortcut>{item.code}</Command.Shortcut> : null}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            )}
            {showsCalendar === true ? (
              <DatePicker
                value={draft.rawValue.length === 0 ? undefined : new Date(Number(draft.rawValue))}
                onApply={(value) => stageDraft(setFilterDraftValue(draft, String(value.getTime())))}
              >
                {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- Entering the explicit date stage transfers focus into the calendar. */}
                <DatePicker.Panel autoFocus />
              </DatePicker>
            ) : null}
            {draft.operator === "in" && draft.stage === "value" && draft.tokens.length > 0 ? (
              <Box flexWrap="wrap" gap="xs" padding="s">
                {draft.tokens.map((token, index) => (
                  <Button
                    key={`${token}:${index}`}
                    aria-label={`Remove value ${token}`}
                    size="xs"
                    variant="secondary"
                    onClick={() => updateValue(setFilterDraftTokens(draft, draft.tokens.filter((_, tokenIndex) => tokenIndex !== index)))}
                  >
                    {token}
                  </Button>
                ))}
              </Box>
            ) : null}
            {issue === null ? null : (
              <Field.Root invalid>
                <Field.Error id="filter-value-error" match>{issue}</Field.Error>
              </Field.Root>
            )}
            <Command.Footer>
              <Box alignItems="center" gap="m">
                <Box alignItems="center" gap="xs">
                  <Command.Key>↑</Command.Key><Command.Key>↓</Command.Key>
                  <Text color="muted" variant="caption">Navigate</Text>
                </Box>
                <Box alignItems="center" gap="xs">
                  <Command.Key>Enter</Command.Key>
                  <Text color="muted" variant="caption">Select / Apply</Text>
                </Box>
                <Box alignItems="center" gap="xs">
                  <Command.Key>Esc</Command.Key>
                  <Text color="muted" variant="caption">Cancel</Text>
                </Box>
              </Box>
            </Command.Footer>
          </Command.Root>
        )}
        <Command.Close />
      </Command.Dialog>
    </>
  );
}

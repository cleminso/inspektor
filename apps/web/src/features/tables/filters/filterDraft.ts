import type { ColumnDescriptor } from 'jazz-tools'

import { createFilterClauseId, parseFilterTokens, parseFilterValue } from './filterParsing'
import type { TableFilterClause, TableFilterOperator } from './tableFilters'

export type FilterDraftStage = 'column' | 'operator' | 'value' | 'date'
export type FilterDraft = {
  mode: 'create' | 'edit'
  editIndex: number | null
  persistedId: string | null
  stage: FilterDraftStage
  column: ColumnDescriptor | null
  operator: TableFilterOperator | null
  rawValue: string
  tokens: string[]
}

function formatDraftValue(value: unknown): { rawValue: string; tokens: string[] } {
  if (Array.isArray(value)) {
    return { rawValue: '', tokens: value.map((item) => String(item)) }
  }
  return { rawValue: typeof value === 'string' ? value : String(value), tokens: [] }
}

export function createFilterDraft(): FilterDraft {
  return {
    mode: 'create',
    editIndex: null,
    persistedId: null,
    stage: 'column',
    column: null,
    operator: null,
    rawValue: '',
    tokens: [],
  }
}

export function editFilterDraft(
  clause: TableFilterClause,
  editIndex: number,
  stage: FilterDraftStage,
  column: ColumnDescriptor | null,
): FilterDraft {
  return {
    mode: 'edit',
    editIndex,
    persistedId: clause.id,
    stage,
    column,
    operator: clause.operator,
    ...formatDraftValue(clause.value),
  }
}

export function selectFilterColumn(draft: FilterDraft, column: ColumnDescriptor): FilterDraft {
  return { ...draft, column, operator: null, rawValue: '', tokens: [], stage: 'operator' }
}

export function selectFilterOperator(
  draft: FilterDraft,
  operator: TableFilterOperator,
): FilterDraft {
  return { ...draft, operator, rawValue: '', tokens: [], stage: 'value' }
}

export function setFilterDraftValue(draft: FilterDraft, rawValue: string): FilterDraft {
  return { ...draft, rawValue, stage: 'value' }
}

export function setFilterDraftTokens(draft: FilterDraft, tokens: string[]): FilterDraft {
  return { ...draft, tokens, stage: 'value' }
}

function parseDraftValue(draft: FilterDraft): unknown {
  if (draft.column === null) throw new Error('Choose a column.')
  if (draft.operator === null) throw new Error('Choose an operator.')
  if (draft.operator === 'in') return parseFilterTokens(draft.column, draft.tokens)
  return parseFilterValue(draft.column, draft.operator, draft.rawValue)
}

export function validateFilterDraft(draft: FilterDraft): string | null {
  try {
    parseDraftValue(draft)
    return null
  } catch (error) {
    return error instanceof Error ? error.message : 'Enter a valid value.'
  }
}

export function resolveFilterDraftIndex(
  draft: FilterDraft,
  filters: readonly TableFilterClause[],
): number | null {
  if (draft.mode !== 'edit' || draft.editIndex === null || draft.persistedId === null) return null
  if (filters[draft.editIndex]?.id === draft.persistedId) return draft.editIndex
  const matchingIndexes = filters.flatMap((filter, index) =>
    filter.id === draft.persistedId ? [index] : [],
  )
  return matchingIndexes.length === 1 ? (matchingIndexes[0] ?? null) : null
}

export function applyFilterDraft(
  draft: FilterDraft,
  filters: readonly TableFilterClause[],
): { filters: TableFilterClause[] } | { issue: string } {
  try {
    if (draft.column === null) return { issue: 'Choose a column.' }
    if (draft.operator === null) return { issue: 'Choose an operator.' }
    const value = parseDraftValue(draft)
    const clause: TableFilterClause = {
      id: draft.persistedId ?? createFilterClauseId(),
      column: draft.column.name,
      operator: draft.operator,
      value,
    }
    if (draft.mode === 'create') return { filters: [...filters, clause] }
    const editIndex = resolveFilterDraftIndex(draft, filters)
    if (editIndex === null) return { issue: 'The filter is no longer available.' }
    return {
      filters: filters.map((filter, index) => (index === editIndex ? clause : filter)),
    }
  } catch (error) {
    return { issue: error instanceof Error ? error.message : 'Enter a valid value.' }
  }
}

export function backspaceFilterDraft(
  draft: FilterDraft,
): { action: 'remove' } | { action: 'cancel' } | { action: 'update'; draft: FilterDraft } {
  try {
    parseDraftValue(draft)
    return { action: 'remove' }
  } catch {
    if (draft.rawValue.length > 0 || draft.tokens.length > 0) {
      return { action: 'update', draft: { ...draft, rawValue: '', tokens: [] } }
    }
    if (draft.operator !== null) {
      return { action: 'update', draft: { ...draft, operator: null, stage: 'operator' } }
    }
    if (draft.column !== null) {
      return { action: 'update', draft: { ...draft, column: null, stage: 'column' } }
    }
    return { action: 'cancel' }
  }
}

export function createFilterRenderKeys(filters: readonly TableFilterClause[]): string[] {
  const occurrences = new Map<string, number>()
  return filters.map((filter) => {
    const occurrence = occurrences.get(filter.id) ?? 0
    occurrences.set(filter.id, occurrence + 1)
    return occurrence === 0 ? filter.id : `${filter.id}:${occurrence}`
  })
}

import type { IntrospectionSubscriptionGroup, IntrospectionSubscriptionResponse } from 'jazz-tools'

import { getHttpErrorStatus } from '@app/connections/connectionValidation'

export type QuerySubscriptionGroup = IntrospectionSubscriptionGroup

export interface QuerySubscriptionsError {
  kind: 'unauthorized' | 'app-not-found' | 'network' | 'invalid-response' | 'server' | 'unknown'
}

export type QuerySubscriptionsValidationResult =
  | { valid: true; value: IntrospectionSubscriptionResponse }
  | { valid: false; error: QuerySubscriptionsError & { kind: 'invalid-response' } }

export interface SuccessfulQuerySubscriptionsCapture {
  kind: 'success'
  id: string
  generatedAt: number
  groups: readonly QuerySubscriptionGroup[]
}

export type QuerySubscriptionsCapture =
  | SuccessfulQuerySubscriptionsCapture
  | {
      kind: 'failure'
      id: string
      attemptedAt: number
      error: QuerySubscriptionsError
    }

export type QuerySubscriptionTimelineCell =
  | { captureId: string; state: 'present'; group: QuerySubscriptionGroup }
  | { captureId: string; state: 'absent' }
  | { captureId: string; state: 'unknown' }

export interface QuerySubscriptionTrack {
  groupKey: string
  cells: QuerySubscriptionTimelineCell[]
}

export interface QuerySubscriptionLane {
  table: string
  tracks: QuerySubscriptionTrack[]
}

export interface QuerySubscriptionsTimeline {
  lanes: QuerySubscriptionLane[]
  latestSuccessfulCapture: SuccessfulQuerySubscriptionsCapture | null
}

export interface QueryFilterOptions {
  tables: string[]
  branches: string[]
}

export interface QuerySubscriptionFilters {
  tables: readonly string[] | null
  branches: readonly string[] | null
  propagations: readonly QuerySubscriptionGroup['propagation'][] | null
}

const invalidResponse = {
  valid: false,
  error: { kind: 'invalid-response' },
} as const

export function validateQuerySubscriptionsResponse(
  response: unknown,
  expectedAppId: string,
): QuerySubscriptionsValidationResult {
  try {
    if (
      isRecord(response) === false ||
      response.appId !== expectedAppId ||
      typeof response.generatedAt !== 'number' ||
      Number.isFinite(response.generatedAt) === false ||
      response.generatedAt < 0 ||
      Array.isArray(response.queries) === false ||
      response.queries.every(isQuerySubscriptionGroup) === false
    ) {
      return invalidResponse
    }

    return {
      valid: true,
      value: {
        appId: response.appId,
        generatedAt: response.generatedAt,
        queries: response.queries.map((group) => ({
          groupKey: group.groupKey,
          count: group.count,
          table: group.table,
          query: group.query,
          branches: [...group.branches],
          propagation: group.propagation,
        })),
      },
    }
  } catch {
    return invalidResponse
  }
}

export function normalizeQuerySubscriptionsError(error: unknown): QuerySubscriptionsError {
  if (error instanceof SyntaxError) {
    return { kind: 'invalid-response' }
  }
  const status = getHttpErrorStatus(error)
  if (status === 401 || status === 403) {
    return { kind: 'unauthorized' }
  }
  if (status === 404) {
    return { kind: 'app-not-found' }
  }
  if (status !== null) {
    return { kind: 'server' }
  }
  if (error instanceof TypeError) {
    return { kind: 'network' }
  }
  return { kind: 'unknown' }
}

export function reduceQuerySubscriptionsHistory(
  history: readonly QuerySubscriptionsCapture[],
  capture: QuerySubscriptionsCapture,
  limit: number,
): readonly QuerySubscriptionsCapture[] {
  const latestSuccessfulCapture = findLatestSuccessfulCapture(history)
  if (
    capture.kind === 'success' &&
    latestSuccessfulCapture !== null &&
    capture.generatedAt <= latestSuccessfulCapture.generatedAt
  ) {
    return history
  }

  const nextHistory = [...history, capture]
  const boundedHistory = nextHistory.slice(-limit)
  if (findLatestSuccessfulCapture(boundedHistory) !== null) {
    return boundedHistory
  }

  const retainedSuccess = findLatestSuccessfulCapture(nextHistory)
  return retainedSuccess === null ? boundedHistory : [retainedSuccess, ...boundedHistory.slice(1)]
}

export function parseQuerySubscriptionSource(source: string, environment: string) {
  const environmentPrefix = `${environment}-`
  const match = /^([0-9a-f]{12})-(.+)$/iu.exec(
    source.startsWith(environmentPrefix) ? source.slice(environmentPrefix.length) : '',
  )
  return match === null ? null : { schemaVersion: match[1]!, branch: match[2]! }
}

export function deriveQueryFilterOptions(
  history: readonly QuerySubscriptionsCapture[],
  environment: string,
): QueryFilterOptions {
  const tables = new Set<string>()
  const branches = new Set<string>()

  for (const capture of history) {
    if (capture.kind === 'failure') {
      continue
    }
    for (const group of capture.groups) {
      tables.add(group.table)
      for (const source of group.branches) {
        branches.add(parseQuerySubscriptionSource(source, environment)?.branch ?? source)
      }
    }
  }

  return {
    tables: [...tables].sort(compareText),
    branches: [...branches].sort(compareText),
  }
}

export function filterQuerySubscriptionGroups(
  groups: readonly QuerySubscriptionGroup[],
  filters: QuerySubscriptionFilters,
  environment: string,
): readonly QuerySubscriptionGroup[] {
  return groups.filter(
    (group) =>
      (filters.tables === null || filters.tables.includes(group.table)) &&
      (filters.branches === null ||
        group.branches.some((source) =>
          filters.branches?.includes(
            parseQuerySubscriptionSource(source, environment)?.branch ?? source,
          ),
        )) &&
      (filters.propagations === null || filters.propagations.includes(group.propagation)),
  )
}

export function projectQuerySubscriptionsTimeline(
  history: readonly QuerySubscriptionsCapture[],
): QuerySubscriptionsTimeline {
  const tracksByTable = new Map<string, Set<string>>()

  for (const capture of history) {
    if (capture.kind === 'failure') {
      continue
    }
    for (const group of capture.groups) {
      const groupKeys = tracksByTable.get(group.table) ?? new Set<string>()
      groupKeys.add(group.groupKey)
      tracksByTable.set(group.table, groupKeys)
    }
  }

  const lanes = [...tracksByTable.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(([table, groupKeys]) => ({
      table,
      tracks: [...groupKeys].sort(compareText).map((groupKey) => ({
        groupKey,
        cells: history.map((capture) => projectCell(capture, table, groupKey)),
      })),
    }))

  return {
    lanes,
    latestSuccessfulCapture: findLatestSuccessfulCapture(history),
  }
}

function isQuerySubscriptionGroup(value: unknown): value is QuerySubscriptionGroup {
  return (
    isRecord(value) === true &&
    typeof value.groupKey === 'string' &&
    value.groupKey.trim().length > 0 &&
    Number.isInteger(value.count) === true &&
    (value.count as number) > 0 &&
    typeof value.table === 'string' &&
    value.table.trim().length > 0 &&
    typeof value.query === 'string' &&
    Array.isArray(value.branches) === true &&
    value.branches.every((branch) => typeof branch === 'string') &&
    (value.propagation === 'full' || value.propagation === 'local-only')
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Array.isArray(value) === false
}

function findLatestSuccessfulCapture(
  history: readonly QuerySubscriptionsCapture[],
): SuccessfulQuerySubscriptionsCapture | null {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const capture = history[index]
    if (capture?.kind === 'success') {
      return capture
    }
  }
  return null
}

function projectCell(
  capture: QuerySubscriptionsCapture,
  table: string,
  groupKey: string,
): QuerySubscriptionTimelineCell {
  if (capture.kind === 'failure') {
    return { captureId: capture.id, state: 'unknown' }
  }

  const group = capture.groups.find(
    (candidate) => candidate.table === table && candidate.groupKey === groupKey,
  )
  return group === undefined
    ? { captureId: capture.id, state: 'absent' }
    : { captureId: capture.id, state: 'present', group }
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

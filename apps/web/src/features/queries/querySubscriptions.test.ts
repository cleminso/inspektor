import { describe, expect, it } from 'vitest'

import {
  normalizeQuerySubscriptionsError,
  projectQuerySubscriptionsTimeline,
  reduceQuerySubscriptionsHistory,
  validateQuerySubscriptionsResponse,
  type QuerySubscriptionGroup,
  type QuerySubscriptionsCapture,
  type SuccessfulQuerySubscriptionsCapture,
} from './querySubscriptions'

const accountsGroup: QuerySubscriptionGroup = {
  groupKey: 'accounts-by-name',
  count: 2,
  table: 'accounts',
  query: '{"where":{"name":"Ada"}}',
  branches: ['main'],
  propagation: 'full',
}

function success(
  id: string,
  generatedAt: number,
  groups: readonly QuerySubscriptionGroup[],
): SuccessfulQuerySubscriptionsCapture {
  return {
    kind: 'success',
    id,
    generatedAt,
    groups,
  }
}

describe('validateQuerySubscriptionsResponse', () => {
  it('accepts an empty successful response', () => {
    expect(
      validateQuerySubscriptionsResponse({ appId: 'app-1', generatedAt: 0, queries: [] }, 'app-1'),
    ).toMatchObject({ valid: true, value: { queries: [] } })
  })

  it('copies only validated fields into retained telemetry', () => {
    const branches = ['main']
    const response = {
      appId: 'app-1',
      generatedAt: 12,
      queries: [{ ...accountsGroup, branches, privateBody: 'must-not-leak' }],
      adminSecret: 'must-not-leak',
    }

    const result = validateQuerySubscriptionsResponse(response, 'app-1')
    branches.push('replacement')
    response.queries[0]!.query = 'mutated'

    expect(result).toEqual({
      valid: true,
      value: {
        appId: 'app-1',
        generatedAt: 12,
        queries: [accountsGroup],
      },
    })
  })

  it.each([
    [{ appId: 'another-app', generatedAt: 1, queries: [] }],
    [{ appId: 'app-1', generatedAt: Number.NaN, queries: [] }],
    [{ appId: 'app-1', generatedAt: -1, queries: [] }],
    [{ appId: 'app-1', generatedAt: 1, queries: [{}] }],
    [
      {
        appId: 'app-1',
        generatedAt: 1,
        queries: [{ ...accountsGroup, count: 0 }],
      },
    ],
    [
      {
        appId: 'app-1',
        generatedAt: 1,
        queries: [{ ...accountsGroup, branches: ['main', 2] }],
      },
    ],
    [
      {
        appId: 'app-1',
        generatedAt: 1,
        queries: [{ ...accountsGroup, propagation: 'remote' }],
      },
    ],
  ])('rejects a mismatched or malformed response %#', (response) => {
    expect(validateQuerySubscriptionsResponse(response, 'app-1')).toEqual({
      valid: false,
      error: { kind: 'invalid-response' },
    })
  })
})

describe('normalizeQuerySubscriptionsError', () => {
  it.each([
    [
      new Error('Server subscriptions fetch failed: 401 Unauthorized - private body'),
      'unauthorized',
    ],
    [{ status: 403, body: 'private body' }, 'unauthorized'],
    [{ response: { status: 404 } }, 'app-not-found'],
    [{ status: 503 }, 'server'],
    [new TypeError('Failed to fetch private.example'), 'network'],
    [new SyntaxError('Unexpected token 401 in private JSON'), 'invalid-response'],
    [{ adminSecret: 'must-not-leak' }, 'unknown'],
  ] as const)('returns only the redacted %s category', (error, kind) => {
    expect(normalizeQuerySubscriptionsError(error)).toEqual({ kind })
  })
})

describe('reduceQuerySubscriptionsHistory', () => {
  it('appends successful and failed captures while pruning the oldest captures', () => {
    const failed: QuerySubscriptionsCapture = {
      kind: 'failure',
      id: 'capture-2',
      attemptedAt: 2,
      error: { kind: 'network' },
    }

    const first = reduceQuerySubscriptionsHistory([], success('capture-1', 1, []), 2)
    const second = reduceQuerySubscriptionsHistory(first, failed, 2)
    const third = reduceQuerySubscriptionsHistory(second, success('capture-3', 3, []), 2)

    expect(third.map(({ id }) => id)).toEqual(['capture-2', 'capture-3'])
  })

  it('ignores repeated successful snapshots and older snapshots after failures', () => {
    const history = [success('capture-1', 10, [])] satisfies QuerySubscriptionsCapture[]

    expect(
      reduceQuerySubscriptionsHistory(history, success('duplicate', 10, [accountsGroup]), 10),
    ).toBe(history)

    const failedHistory = [
      ...history,
      {
        kind: 'failure',
        id: 'capture-2',
        attemptedAt: 11,
        error: { kind: 'network' },
      },
    ] satisfies QuerySubscriptionsCapture[]

    expect(
      reduceQuerySubscriptionsHistory(failedHistory, success('older', 9, [accountsGroup]), 10),
    ).toBe(failedHistory)
  })

  it('retains the latest successful capture while pruning repeated failures', () => {
    const history = [
      success('successful', 10, [accountsGroup]),
      {
        kind: 'failure',
        id: 'failure-1',
        attemptedAt: 11,
        error: { kind: 'network' },
      },
      {
        kind: 'failure',
        id: 'failure-2',
        attemptedAt: 12,
        error: { kind: 'network' },
      },
    ] satisfies QuerySubscriptionsCapture[]

    const reduced = reduceQuerySubscriptionsHistory(
      history,
      {
        kind: 'failure',
        id: 'failure-3',
        attemptedAt: 13,
        error: { kind: 'network' },
      },
      3,
    )

    expect(reduced.map(({ id }) => id)).toEqual(['successful', 'failure-2', 'failure-3'])
  })
})

describe('projectQuerySubscriptionsTimeline', () => {
  it('projects tables, tracks, and present, absent, and unknown cells in deterministic order', () => {
    const auditGroup: QuerySubscriptionGroup = {
      groupKey: 'audit-recent',
      count: 1,
      table: 'auditLog',
      query: '{}',
      branches: [],
      propagation: 'local-only',
    }
    const accountsById = {
      ...accountsGroup,
      groupKey: 'accounts-by-id',
      count: 1,
      query: '{"where":{"id":"account-1"}}',
    }
    const history: QuerySubscriptionsCapture[] = [
      success('capture-1', 1, [auditGroup, accountsGroup]),
      success('capture-2', 2, [accountsById, { ...accountsGroup, count: 3 }]),
      {
        kind: 'failure',
        id: 'capture-3',
        attemptedAt: 3,
        error: { kind: 'server' },
      },
    ]

    const timeline = projectQuerySubscriptionsTimeline(history)

    expect(timeline.latestSuccessfulCapture).toBe(history[1])
    expect(timeline.lanes.map(({ table }) => table)).toEqual(['accounts', 'auditLog'])
    expect(timeline.lanes[0]?.tracks.map(({ groupKey }) => groupKey)).toEqual([
      'accounts-by-id',
      'accounts-by-name',
    ])
    expect(timeline.lanes[0]?.tracks[0]?.cells).toEqual([
      { captureId: 'capture-1', state: 'absent' },
      { captureId: 'capture-2', state: 'present', group: accountsById },
      { captureId: 'capture-3', state: 'unknown' },
    ])
    expect(timeline.lanes[0]?.tracks[1]?.cells[1]).toEqual({
      captureId: 'capture-2',
      state: 'present',
      group: { ...accountsGroup, count: 3 },
    })
    expect(timeline.lanes[1]?.tracks[0]?.cells.map(({ state }) => state)).toEqual([
      'present',
      'absent',
      'unknown',
    ])
  })
})

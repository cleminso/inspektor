// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  childBatchSize,
  createInitialExpansion,
  createRenderPlan,
  rootPath,
  visibleTreeItemLimit,
} from './jsonViewRenderPlan'

function expectCompleteTreeWithinBudget(plan: ReturnType<typeof createRenderPlan>): void {
  const continuationCount = [...plan.containers.values()].filter(
    ({ continuationKind }) => continuationKind !== null,
  ).length
  expect(plan.visiblePaths.size + continuationCount).toBeLessThanOrEqual(visibleTreeItemLimit)
}

describe('JSON view render planning', () => {
  it.each([
    [0, []],
    [1, ['$']],
    [2, ['$', '$/profile']],
    [3, ['$', '$/profile', '$/profile/contact']],
    [4, ['$', '$/profile', '$/profile/contact', '$/profile/contact/address']],
  ] as const)('expands nested containers through depth %s', (depth, expectedPaths) => {
    const data = {
      profile: {
        contact: {
          address: {
            city: { name: 'London' },
          },
        },
      },
    }

    expect([...createInitialExpansion(data, depth)]).toEqual(expectedPaths)
  })

  it('plans fixed child batches without exceeding the complete-tree budget', () => {
    const data = Object.fromEntries(
      Array.from({ length: visibleTreeItemLimit }, (_, index) => [`field-${index}`, index]),
    )

    const initial = createRenderPlan(data, new Set([rootPath]), new Map())
    const revealed = createRenderPlan(
      data,
      new Set([rootPath]),
      new Map([[rootPath, childBatchSize * 2]]),
    )

    expect(initial.containers.get(rootPath)).toEqual({
      continuationKind: 'batch',
      visibleChildCount: childBatchSize,
    })
    expect(revealed.containers.get(rootPath)).toEqual({
      continuationKind: 'batch',
      visibleChildCount: childBatchSize * 2,
    })
    expectCompleteTreeWithinBudget(revealed)
  })

  it('reallocates the complete-tree budget when an expanded branch collapses', () => {
    const data = Object.fromEntries(
      Array.from({ length: 10 }, (_, groupIndex) => [
        `group-${groupIndex}`,
        Object.fromEntries(
          Array.from({ length: 100 }, (_, fieldIndex) => [
            `group-${groupIndex}-field-${fieldIndex}`,
            fieldIndex,
          ]),
        ),
      ]),
    )
    const expandedPaths = new Set([
      rootPath,
      ...Array.from({ length: 10 }, (_, index) => `${rootPath}/group-${index}`),
    ])

    const expanded = createRenderPlan(data, expandedPaths, new Map())
    expandedPaths.delete(`${rootPath}/group-0`)
    const collapsed = createRenderPlan(data, expandedPaths, new Map())

    expectCompleteTreeWithinBudget(expanded)
    expect(expanded.visiblePaths.has(`${rootPath}/group-4/group-4-field-99`)).toBe(false)
    expectCompleteTreeWithinBudget(collapsed)
    expect(collapsed.visiblePaths.has(`${rootPath}/group-0/group-0-field-0`)).toBe(false)
    expect(collapsed.visiblePaths.has(`${rootPath}/group-4/group-4-field-99`)).toBe(true)
  })
})

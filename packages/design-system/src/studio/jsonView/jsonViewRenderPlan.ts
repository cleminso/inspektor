import type { JsonViewObject, JsonViewValue } from './jsonView'

export const childBatchSize = 100
export const visibleTreeItemLimit = 500
export const rootPath = '$'

export type ContinuationKind = 'batch' | 'limit'

export interface ContainerRenderPlan {
  continuationKind: ContinuationKind | null
  visibleChildCount: number
}

export interface JsonRenderPlan {
  containers: ReadonlyMap<string, ContainerRenderPlan>
  visiblePaths: ReadonlySet<string>
}

export function isContainer(
  value: JsonViewValue,
): value is JsonViewObject | readonly JsonViewValue[] {
  return value !== null && typeof value === 'object'
}

export function getEntries(
  value: JsonViewObject | readonly JsonViewValue[],
): readonly [string, JsonViewValue][] {
  if (Array.isArray(value) === true) {
    return value.map((item, index) => [String(index), item] as const)
  }

  return Object.entries(value)
}

export function getPath(parentPath: string, key: string): string {
  return `${parentPath}/${encodeURIComponent(key)}`
}

export function createInitialExpansion(
  data: JsonViewObject | readonly JsonViewValue[],
  defaultExpandDepth: 0 | 1 | 2 | 3 | 4 | 'all',
): Set<string> {
  const paths = new Set<string>()
  let visitedCount = 0

  function visit(value: JsonViewValue, path: string, depth: number): void {
    if (visitedCount >= visibleTreeItemLimit) {
      return
    }
    visitedCount += 1

    if (
      isContainer(value) === false ||
      getEntries(value).length === 0 ||
      (defaultExpandDepth !== 'all' && depth >= defaultExpandDepth)
    ) {
      return
    }

    paths.add(path)
    for (const [key, child] of getEntries(value)) {
      if (visitedCount >= visibleTreeItemLimit) {
        break
      }
      visit(child, getPath(path, key), depth + 1)
    }
  }

  visit(data, rootPath, 0)
  return paths
}

export function createRenderPlan(
  data: JsonViewObject | readonly JsonViewValue[],
  expandedPaths: ReadonlySet<string>,
  revealedChildCounts: ReadonlyMap<string, number>,
): JsonRenderPlan {
  const containers = new Map<string, ContainerRenderPlan>()
  const visiblePaths = new Set<string>([rootPath])
  let remainingTreeItems = visibleTreeItemLimit - 1

  function visit(value: JsonViewValue, path: string, reservedTreeItems: number): void {
    if (isContainer(value) === false || expandedPaths.has(path) === false) {
      return
    }

    const entries = getEntries(value)
    const requestedChildCount = Math.min(
      revealedChildCounts.get(path) ?? childBatchSize,
      entries.length,
    )
    let visibleChildCount = 0

    for (let index = 0; index < requestedChildCount; index += 1) {
      const entry = entries[index]
      if (entry === undefined) {
        break
      }

      const hasFollowingEntry = index + 1 < entries.length
      const continuationReserve = hasFollowingEntry === true ? 1 : 0
      if (remainingTreeItems <= reservedTreeItems + continuationReserve) {
        break
      }

      const [key, child] = entry
      const childPath = getPath(path, key)
      remainingTreeItems -= 1
      visibleChildCount += 1
      visiblePaths.add(childPath)
      visit(child, childPath, reservedTreeItems + continuationReserve)
    }

    let continuationKind: ContinuationKind | null = null
    if (visibleChildCount < entries.length && remainingTreeItems > reservedTreeItems) {
      remainingTreeItems -= 1
      continuationKind = visibleChildCount < requestedChildCount ? 'limit' : 'batch'
    }

    containers.set(path, { continuationKind, visibleChildCount })
  }

  visit(data, rootPath, 0)
  return { containers, visiblePaths }
}

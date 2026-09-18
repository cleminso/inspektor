export type ColumnMoveDirection = 'end' | 'left' | 'right' | 'start'

export function moveColumnInOrder(
  columnOrder: readonly string[],
  columnId: string,
  direction: ColumnMoveDirection,
  visibleColumnOrder: readonly string[] = columnOrder,
): string[] {
  const visibleIndex = visibleColumnOrder.indexOf(columnId)
  if (columnOrder.includes(columnId) === false || visibleIndex < 0) {
    return [...columnOrder]
  }

  const lastVisibleIndex = visibleColumnOrder.length - 1
  const nextVisibleIndex =
    direction === 'start'
      ? 0
      : direction === 'end'
        ? lastVisibleIndex
        : direction === 'left'
          ? Math.max(visibleIndex - 1, 0)
          : Math.min(visibleIndex + 1, lastVisibleIndex)
  const targetColumnId = visibleColumnOrder[nextVisibleIndex]
  if (targetColumnId === undefined || targetColumnId === columnId) {
    return [...columnOrder]
  }
  const nextVisibleColumnOrder = [...visibleColumnOrder]
  const [column] = nextVisibleColumnOrder.splice(visibleIndex, 1)
  if (column !== undefined) {
    nextVisibleColumnOrder.splice(nextVisibleIndex, 0, column)
  }
  const visibleColumnIds = new Set(visibleColumnOrder)
  let nextVisibleColumnIndex = 0
  return columnOrder.map((candidateId) => {
    if (visibleColumnIds.has(candidateId) === false) {
      return candidateId
    }
    const nextColumnId = nextVisibleColumnOrder[nextVisibleColumnIndex]
    nextVisibleColumnIndex += 1
    return nextColumnId ?? candidateId
  })
}

export function normalizeColumnOrder(
  candidateColumnIds: readonly string[],
  knownColumnIds: readonly string[],
): string[] {
  const knownColumnIdSet = new Set(knownColumnIds)
  const includedColumnIds = new Set<string>()
  const normalizedColumnIds: string[] = []

  for (const columnId of candidateColumnIds) {
    if (knownColumnIdSet.has(columnId) === true && includedColumnIds.has(columnId) === false) {
      includedColumnIds.add(columnId)
      normalizedColumnIds.push(columnId)
    }
  }

  for (const columnId of knownColumnIds) {
    if (includedColumnIds.has(columnId) === false) {
      includedColumnIds.add(columnId)
      normalizedColumnIds.push(columnId)
    }
  }

  return normalizedColumnIds
}

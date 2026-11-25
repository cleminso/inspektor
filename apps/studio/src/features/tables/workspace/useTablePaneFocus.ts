import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import type { TableRowId } from '@tables/tableTypes'
import type { useTablePaneState } from '@tables/workspace/useTablePaneState'

type PaneFocusReturn = { kind: 'insert' } | { kind: 'row'; rowId: TableRowId }
type PaneTarget = Pick<ReturnType<typeof useTablePaneState>, 'detailPaneMode' | 'activeRowId'>

/** Returns focus after pane closure, including command-palette focus handoff. */
export function useTablePaneFocus(
  { detailPaneMode, activeRowId }: PaneTarget,
  targets: {
    grid: RefObject<HTMLDivElement | null>
    insert: RefObject<HTMLButtonElement | null>
  },
  resetRepresentation: () => void,
) {
  const paneFocusReturnRef = useRef<PaneFocusReturn | null>(null)
  const pendingPaletteFocusReturnRef = useRef<MutationObserver | null>(null)
  const previousDetailPaneModeRef = useRef(detailPaneMode)
  const focusPaneReturn = useCallback(() => {
    const focusReturn = paneFocusReturnRef.current
    if (focusReturn === null) {
      return
    }
    const restoreFocus = () => {
      const target =
        focusReturn.kind === 'insert'
          ? targets.insert.current
          : (Array.from(
              targets.grid.current?.querySelectorAll<HTMLElement>('[aria-label]') ?? [],
            ).find(
              (element) => element.getAttribute('aria-label') === `Select row ${focusReturn.rowId}`,
            ) ?? null)
      if (target?.isConnected === true) {
        target.focus()
      }
    }
    restoreFocus()
    if (document.querySelector('[role="dialog"] [data-slot="command"]') !== null) {
      pendingPaletteFocusReturnRef.current?.disconnect()
      const observer = new MutationObserver(() => {
        if (document.querySelector('[role="dialog"] [data-slot="command"]') === null) {
          observer.disconnect()
          pendingPaletteFocusReturnRef.current = null
          restoreFocus()
        }
      })
      pendingPaletteFocusReturnRef.current = observer
      observer.observe(document.body, { childList: true, subtree: true })
    }
  }, [targets.grid, targets.insert])
  useEffect(() => {
    return () => pendingPaletteFocusReturnRef.current?.disconnect()
  }, [])
  useLayoutEffect(() => {
    const previousDetailPaneMode = previousDetailPaneModeRef.current
    if (detailPaneMode === 'insert') {
      pendingPaletteFocusReturnRef.current?.disconnect()
      paneFocusReturnRef.current = { kind: 'insert' }
    } else if (detailPaneMode === 'rows' && activeRowId !== null) {
      pendingPaletteFocusReturnRef.current?.disconnect()
      paneFocusReturnRef.current = { kind: 'row', rowId: activeRowId }
    } else if (previousDetailPaneMode !== 'closed') {
      resetRepresentation()
      focusPaneReturn()
      paneFocusReturnRef.current = null
    }
    previousDetailPaneModeRef.current = detailPaneMode
  }, [detailPaneMode, focusPaneReturn, activeRowId, resetRepresentation])
}

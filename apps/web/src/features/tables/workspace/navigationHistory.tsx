import { useRouter } from '@tanstack/react-router'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

interface TableNavigationHistoryState {
  entries: readonly TableNavigationHistoryEntry[]
  index: number
}

interface TableNavigationHistoryEntry {
  browserIndex: number | null
  href: string
}

type TableNavigationHistoryAction =
  | { type: 'push'; browserIndex: number | null; href: string }
  | { type: 'reconcile'; browserIndex: number | null; href: string; offset: number | null }
  | { type: 'replace'; browserIndex: number | null; href: string }

interface TableNavigationControlsContextValue {
  canGoBack: boolean
  canGoForward: boolean
  goBack: () => void
  goForward: () => void
}

interface TableNavigationHistoryProviderProps {
  children: ReactNode
}

const TableNavigationControlsContext = createContext<TableNavigationControlsContextValue | null>(
  null,
)

function appendEntry(
  state: TableNavigationHistoryState,
  entry: TableNavigationHistoryEntry,
): TableNavigationHistoryState {
  const entries = [...state.entries.slice(0, state.index + 1), entry]
  return { entries, index: entries.length - 1 }
}

function findPreviousHrefIndex(
  entries: readonly TableNavigationHistoryEntry[],
  currentIndex: number,
  href: string,
): number {
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    if (entries[index]?.href === href) {
      return index
    }
  }
  return -1
}

function getHistoryIndex(location: { state: unknown }): number | null {
  if (location.state === null || typeof location.state !== 'object') {
    return null
  }
  const index = (location.state as { __TSR_index?: unknown }).__TSR_index
  return typeof index === 'number' && Number.isInteger(index) ? index : null
}

function getTableWorkspacePath(href: string): string | null {
  const pathname = new URL(href, window.location.origin).pathname
  const markerIndex = pathname.indexOf('/tables')
  return markerIndex === -1 ? null : pathname.slice(0, markerIndex + '/tables'.length)
}

function isTableWorkspaceHref(href: string, workspacePath: string | null): boolean {
  if (workspacePath === null) {
    return false
  }
  const pathname = new URL(href, window.location.origin).pathname
  return pathname === workspacePath || pathname.startsWith(`${workspacePath}/`)
}

export function createTableNavigationHistory(
  href: string,
  browserIndex: number | null = 0,
): TableNavigationHistoryState {
  return { entries: [{ browserIndex, href }], index: 0 }
}

export function reduceTableNavigationHistory(
  state: TableNavigationHistoryState,
  action: TableNavigationHistoryAction,
): TableNavigationHistoryState {
  if (action.type === 'reconcile') {
    const entry = { browserIndex: action.browserIndex, href: action.href }
    if (action.browserIndex !== null) {
      const matchingIndex = state.entries.findIndex(
        (candidate, index) =>
          index !== state.index && candidate.browserIndex === action.browserIndex,
      )
      if (matchingIndex !== -1) {
        const entries = [...state.entries]
        entries[matchingIndex] = entry
        return { entries, index: matchingIndex }
      }
    }

    if (action.offset !== null) {
      const targetIndex = state.index + action.offset
      if (targetIndex >= 0 && targetIndex < state.entries.length) {
        const entries = [...state.entries]
        entries[targetIndex] = entry
        return { entries, index: targetIndex }
      }

      const matchingIndex =
        action.browserIndex === null
          ? action.offset < 0
            ? findPreviousHrefIndex(state.entries, state.index, action.href)
            : state.entries.findIndex(
                (candidate, index) => index > state.index && candidate.href === action.href,
              )
          : -1
      if (matchingIndex !== -1) {
        return { ...state, index: matchingIndex }
      }
      if (targetIndex < 0) {
        return { entries: [entry, ...state.entries], index: 0 }
      }
      return appendEntry(state, entry)
    }

    const matchingIndex = state.entries.findIndex((candidate) => candidate.href === action.href)
    if (matchingIndex !== -1) {
      return { ...state, index: matchingIndex }
    }
    return appendEntry(state, entry)
  }

  if (action.type === 'replace') {
    const currentEntry = state.entries[state.index]
    const browserIndex = action.browserIndex ?? currentEntry?.browserIndex ?? null
    if (currentEntry?.href === action.href && currentEntry.browserIndex === browserIndex) {
      return state
    }
    const entries = [...state.entries]
    entries[state.index] = {
      browserIndex,
      href: action.href,
    }
    return { entries, index: state.index }
  }

  return appendEntry(state, { browserIndex: action.browserIndex, href: action.href })
}

export function TableNavigationHistoryProvider({
  children,
}: TableNavigationHistoryProviderProps): React.ReactElement {
  const router = useRouter()
  const [history, setHistory] = useState(() =>
    createTableNavigationHistory(
      router.latestLocation.href,
      getHistoryIndex(router.latestLocation),
    ),
  )
  // Both refs start from the same history snapshot and advance only from committed router events.
  const historyRef = useRef(history)
  const browserIndexRef = useRef(history.entries[history.index]?.browserIndex ?? null)
  const pendingOffsetRef = useRef<number | null>(null)

  useEffect(() => {
    const workspacePath = getTableWorkspacePath(router.latestLocation.href)
    const updateHistory = (action: TableNavigationHistoryAction) => {
      const nextHistory = reduceTableNavigationHistory(historyRef.current, action)
      historyRef.current = nextHistory
      setHistory(nextHistory)
    }
    const unsubscribe = router.history.subscribe(({ action, location }) => {
      if (isTableWorkspaceHref(location.href, workspacePath) === false) {
        return
      }
      const browserIndex = getHistoryIndex(location)
      if (
        action.type !== 'PUSH' &&
        action.type !== 'REPLACE' &&
        browserIndex !== null &&
        browserIndex === browserIndexRef.current &&
        location.href === historyRef.current.entries[historyRef.current.index]?.href
      ) {
        return
      }
      browserIndexRef.current = browserIndex
      if (action.type !== 'PUSH' && action.type !== 'REPLACE') {
        const offset =
          action.type === 'BACK'
            ? -1
            : action.type === 'FORWARD'
              ? 1
              : action.type === 'GO' && action.index !== 0
                ? action.index
                : (pendingOffsetRef.current ??
                  (historyRef.current.entries[historyRef.current.index - 1]?.href === location.href
                    ? -1
                    : historyRef.current.entries[historyRef.current.index + 1]?.href ===
                        location.href
                      ? 1
                      : -1))
        pendingOffsetRef.current = null
        updateHistory({
          type: 'reconcile',
          browserIndex,
          href: location.href,
          offset,
        })
        return
      }

      updateHistory({
        type: action.type === 'REPLACE' ? 'replace' : 'push',
        browserIndex,
        href: location.href,
      })
    })
    if (isTableWorkspaceHref(router.history.location.href, workspacePath) === true) {
      const latestIndex = getHistoryIndex(router.latestLocation)
      const historyIndex = getHistoryIndex(router.history.location)
      browserIndexRef.current = historyIndex
      updateHistory(
        latestIndex !== null && historyIndex !== null && latestIndex !== historyIndex
          ? {
              type: 'reconcile',
              browserIndex: historyIndex,
              href: router.history.location.href,
              offset: historyIndex - latestIndex,
            }
          : {
              type: 'replace',
              browserIndex: historyIndex,
              href: router.history.location.href,
            },
      )
    }
    return unsubscribe
  }, [router])

  const moveTo = useCallback(
    (index: number) => {
      const currentHistory = historyRef.current
      if (index < 0 || index >= currentHistory.entries.length || index === currentHistory.index) {
        return
      }

      const currentBrowserIndex = currentHistory.entries[currentHistory.index]?.browserIndex
      const targetBrowserIndex = currentHistory.entries[index]?.browserIndex
      const browserOffset =
        currentBrowserIndex !== null &&
        currentBrowserIndex !== undefined &&
        targetBrowserIndex !== null &&
        targetBrowserIndex !== undefined
          ? targetBrowserIndex - currentBrowserIndex
          : 0
      const offset = browserOffset === 0 ? index - currentHistory.index : browserOffset
      pendingOffsetRef.current = offset
      router.history.go(offset)
    },
    [router],
  )
  const goBack = useCallback(() => {
    const index = historyRef.current.index
    if (index > 0) {
      moveTo(index - 1)
    }
  }, [moveTo])
  const goForward = useCallback(() => {
    const currentHistory = historyRef.current
    if (currentHistory.index < currentHistory.entries.length - 1) {
      moveTo(currentHistory.index + 1)
    }
  }, [moveTo])
  const controlsValue = useMemo<TableNavigationControlsContextValue>(
    () => ({
      canGoBack: history.index > 0,
      canGoForward: history.index < history.entries.length - 1,
      goBack,
      goForward,
    }),
    [goBack, goForward, history.entries.length, history.index],
  )

  return (
    <TableNavigationControlsContext.Provider value={controlsValue}>
      {children}
    </TableNavigationControlsContext.Provider>
  )
}

export function useTableNavigationControls(): TableNavigationControlsContextValue {
  const context = use(TableNavigationControlsContext)
  if (context === null) {
    throw new Error('useTableNavigationControls must be used within TableNavigationHistoryProvider')
  }
  return context
}

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
  entries: readonly string[]
  index: number
}

type TableNavigationHistoryAction =
  | { type: 'move'; index: number }
  | { type: 'push'; href: string }
  | { type: 'reconcile'; direction: 'back' | 'forward' | 'unknown'; href: string }
  | { type: 'replace'; href: string }

interface TableNavigationControlsContextValue {
  canGoBack: boolean
  canGoForward: boolean
  goBack: () => void
  goForward: () => void
}

interface TableNavigationHistoryProviderProps {
  children: ReactNode
}

interface TableNavigationReplayState {
  __inspectorTablesNavigationIndex?: number
}

const TableNavigationControlsContext = createContext<TableNavigationControlsContextValue | null>(
  null,
)

function appendHref(
  state: TableNavigationHistoryState,
  href: string,
): TableNavigationHistoryState {
  const entries = [...state.entries.slice(0, state.index + 1), href]
  return { entries, index: entries.length - 1 }
}

function findPreviousHrefIndex(
  entries: readonly string[],
  currentIndex: number,
  href: string,
): number {
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    if (entries[index] === href) {
      return index
    }
  }
  return -1
}

export function createTableNavigationHistory(href: string): TableNavigationHistoryState {
  return { entries: [href], index: 0 }
}

export function reduceTableNavigationHistory(
  state: TableNavigationHistoryState,
  action: TableNavigationHistoryAction,
): TableNavigationHistoryState {
  if (action.type === 'move') {
    if (action.index < 0 || action.index >= state.entries.length || action.index === state.index) {
      return state
    }
    return { ...state, index: action.index }
  }

  if (action.type === 'reconcile') {
    const matchingIndex =
      action.direction === 'back'
        ? findPreviousHrefIndex(state.entries, state.index, action.href)
        : action.direction === 'forward'
          ? state.entries.findIndex((href, index) => index > state.index && href === action.href)
          : state.entries.findIndex((href) => href === action.href)
    return matchingIndex === -1
      ? appendHref(state, action.href)
      : { ...state, index: matchingIndex }
  }

  if (action.type === 'replace') {
    const entries = [...state.entries]
    entries[state.index] = action.href
    return { entries, index: state.index }
  }

  return state.entries[state.index] === action.href ? state : appendHref(state, action.href)
}

export function TableNavigationHistoryProvider({
  children,
}: TableNavigationHistoryProviderProps): React.ReactElement {
  const router = useRouter()
  const [history, setHistory] = useState(() =>
    createTableNavigationHistory(router.latestLocation.href),
  )
  const historyRef = useRef(history)
  historyRef.current = history

  useEffect(
    () =>
      router.history.subscribe(({ action, location }) => {
        if (action.type !== 'PUSH' && action.type !== 'REPLACE') {
          setHistory((currentHistory) =>
            reduceTableNavigationHistory(currentHistory, {
              type: 'reconcile',
              direction:
                action.type === 'BACK'
                  ? 'back'
                  : action.type === 'FORWARD'
                    ? 'forward'
                    : 'unknown',
              href: location.href,
            }),
          )
          return
        }

        const replayIndex = (location.state as TableNavigationReplayState)
          .__inspectorTablesNavigationIndex
        if (replayIndex !== undefined) {
          setHistory((currentHistory) =>
            reduceTableNavigationHistory(currentHistory, { type: 'move', index: replayIndex }),
          )
          return
        }

        setHistory((currentHistory) =>
          reduceTableNavigationHistory(currentHistory, {
            type: action.type === 'REPLACE' ? 'replace' : 'push',
            href: location.href,
          }),
        )
      }),
    [router],
  )

  const moveTo = useCallback(
    (index: number) => {
      const href = historyRef.current.entries[index]
      if (href === undefined) {
        return
      }
      if (href === router.latestLocation.href) {
        setHistory((currentHistory) =>
          reduceTableNavigationHistory(currentHistory, { type: 'move', index }),
        )
        return
      }

      router.history.push(href, { __inspectorTablesNavigationIndex: index })
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

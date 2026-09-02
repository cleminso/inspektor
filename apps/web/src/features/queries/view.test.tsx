import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Fragment, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Tooltip } from '@inspector/ds'

import type { StoredConnection } from '@app/connections/connections'

import {
  projectQuerySubscriptionsTimeline,
  type QuerySubscriptionGroup,
  type QuerySubscriptionsCapture,
} from './querySubscriptions'
import type { QuerySubscriptionsTelemetry } from './useQuerySubscriptionsTelemetry'
import { QueriesView } from './view'

const mocks = vi.hoisted(() => ({
  connection: null as StoredConnection | null,
  panelResize: null as (() => void) | null,
  telemetry: null as QuerySubscriptionsTelemetry | null,
}))
const useQuerySubscriptionsTelemetry = vi.hoisted(() => vi.fn())

vi.mock('@app/providers/inspectorProvider', () => ({
  getConnectionProfileToken: (connection: StoredConnection) => JSON.stringify(connection),
  useInspectorSessionState: () => ({ activeConnection: mocks.connection }),
}))

vi.mock('./useQuerySubscriptionsTelemetry', () => ({
  useQuerySubscriptionsTelemetry,
}))

vi.mock('@inspector/ds', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inspector/ds')>()
  return {
    ...actual,
    ResizableHandle: () => <div role="separator" />,
    ResizablePanel: ({
      children,
      minSize,
      onResize,
    }: {
      children: ReactNode
      minSize?: number
      onResize?: () => void
    }) => {
      if (onResize !== undefined) mocks.panelResize = onResize
      return <div data-panel-min-size={minSize}>{children}</div>
    },
    ResizablePanelGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    ShellLayout: {
      Body: Fragment,
      LeftDock: ({ children }: { children: ReactNode }) => (
        <div data-testid="shell-left-dock">{children}</div>
      ),
      RightDock: ({ children }: { children: ReactNode }) => (
        <div data-testid="shell-right-dock">{children}</div>
      ),
      View: Fragment,
    },
  }
})

const accountsGroup: QuerySubscriptionGroup = {
  groupKey: 'accounts-by-name',
  count: 2,
  table: 'accounts',
  query: '{"where":{"name":"Ada"}}',
  branches: ['main'],
  propagation: 'full',
}

const auditGroup: QuerySubscriptionGroup = {
  ...accountsGroup,
  groupKey: 'audit-recent',
  table: 'auditLog',
  branches: ['release'],
  propagation: 'local-only',
}

function success(
  id: string,
  generatedAt: number,
  groups: readonly QuerySubscriptionGroup[],
): QuerySubscriptionsCapture {
  return { kind: 'success', id, generatedAt, groups }
}

function telemetry(
  history: readonly QuerySubscriptionsCapture[],
  state?: QuerySubscriptionsTelemetry['state']['kind'],
): QuerySubscriptionsTelemetry {
  const timeline = projectQuerySubscriptionsTimeline(history)
  const inferredState = timeline.latestSuccessfulCapture === null ? 'failed-initial-load' : 'ready'
  return {
    history,
    timeline,
    state: { kind: state ?? inferredState },
    refresh: vi.fn(),
  }
}

beforeEach(() => {
  mocks.connection = {
    id: 'connection-1',
    name: 'Test app',
    env: 'test',
    serverUrl: 'https://example.com',
    appId: 'app-1',
    adminSecret: 'secret-1',
  }
  mocks.telemetry = telemetry([])
  mocks.panelResize = null
  useQuerySubscriptionsTelemetry.mockImplementation(() => mocks.telemetry)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('QueriesView', () => {
  it('reads active connection credentials and renders initial loading', () => {
    mocks.telemetry = telemetry([], 'initial-loading')

    render(<QueriesView />)

    expect(useQuerySubscriptionsTelemetry).toHaveBeenCalledWith(mocks.connection)
    expect(screen.getByRole('status').textContent).toContain('Loading query subscriptions')
    expect(screen.queryByRole('table', { name: 'Query subscriptions' })).toBeNull()
  })

  it('renders successful emptiness separately from initial failure', () => {
    mocks.telemetry = telemetry([success('empty', 1_000, [])])
    const view = render(<QueriesView />)

    expect(screen.getByText('No active query subscriptions')).toBeTruthy()

    const refresh = vi.fn()
    mocks.telemetry = {
      ...telemetry([
        { kind: 'failure', id: 'failed', attemptedAt: 2_000, error: { kind: 'network' } },
      ]),
      refresh,
    }
    view.rerender(<QueriesView />)

    expect(screen.getByRole('alert').textContent).toContain("Couldn't load query subscriptions")
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('renders query filters with Only and Check all actions', () => {
    mocks.telemetry = telemetry([success('capture-1', 1_000, [accountsGroup, auditGroup])])
    render(<QueriesView />)

    const dock = screen.getByTestId('shell-left-dock')
    expect(within(dock).getByRole('group', { name: 'Filter by table' })).toBeTruthy()
    expect(within(dock).getByRole('group', { name: 'Filter by branch' })).toBeTruthy()
    expect(within(dock).getByRole('group', { name: 'Filter by propagation' })).toBeTruthy()

    fireEvent.click(within(dock).getByRole('button', { name: 'Only accounts' }))
    expect(screen.getByRole('button', { name: /^accounts\s*1$/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^auditLog\s*1$/ })).toBeNull()

    fireEvent.click(within(dock).getByRole('button', { name: 'Check all from accounts' }))
    expect(screen.getByRole('button', { name: /^auditLog\s*1$/ })).toBeTruthy()
  })

  it('keeps dynamic options checked only while their section is unrestricted', () => {
    mocks.telemetry = telemetry([success('capture-1', 1_000, [accountsGroup])])
    const view = render(<QueriesView />)

    mocks.telemetry = telemetry([
      success('capture-1', 1_000, [accountsGroup]),
      success('capture-2', 2_000, [accountsGroup, auditGroup]),
    ])
    view.rerender(<QueriesView />)

    expect(
      screen.getByRole('checkbox', { name: 'Select auditLog' }).getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      screen.getByRole('checkbox', { name: 'Select release' }).getAttribute('aria-checked'),
    ).toBe('true')
    expect(screen.getByRole('button', { name: /^auditLog\s*1$/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Only accounts' }))
    mocks.telemetry = telemetry([success('capture-3', 3_000, [accountsGroup])])
    view.rerender(<QueriesView />)

    mocks.telemetry = telemetry([
      ...mocks.telemetry.history,
      success('capture-4', 4_000, [
        accountsGroup,
        auditGroup,
        { ...auditGroup, groupKey: 'billing-recent', table: 'billing' },
      ]),
    ])
    view.rerender(<QueriesView />)

    expect(
      screen.getByRole('checkbox', { name: 'Select billing' }).getAttribute('aria-checked'),
    ).toBe('false')
    expect(screen.queryByRole('button', { name: /^billing\s*1$/ })).toBeNull()
  })

  it('keeps Only restrictive when its section initially has one option', () => {
    mocks.telemetry = telemetry([success('capture-1', 1_000, [accountsGroup])])
    const view = render(<QueriesView />)

    fireEvent.click(screen.getByRole('button', { name: 'Only accounts' }))
    fireEvent.click(screen.getByRole('button', { name: 'Only accounts' }))
    mocks.telemetry = telemetry([
      success('capture-1', 1_000, [accountsGroup]),
      success('capture-2', 2_000, [accountsGroup, auditGroup]),
    ])
    view.rerender(<QueriesView />)

    expect(
      screen.getByRole('checkbox', { name: 'Select auditLog' }).getAttribute('aria-checked'),
    ).toBe('false')
  })

  it('shows an empty filtered result without moving focus from its filter', () => {
    const history = [success('capture-1', 1_000, [accountsGroup])]
    mocks.telemetry = telemetry(history)
    render(<QueriesView />)

    fireEvent.click(screen.getByRole('button', { name: /Open accounts-by-name at/ }))
    const filter = screen.getByRole('checkbox', { name: 'Select accounts' })
    filter.focus()
    fireEvent.click(filter)

    expect(screen.getByText('No query subscriptions match filters')).toBeTruthy()
    expect(document.activeElement).toBe(filter)
  })

  it('maps lanes, tracks, and present, absent, and unknown cells and derives selected details', async () => {
    const history: QuerySubscriptionsCapture[] = [
      success('capture-1', 1_000, [accountsGroup]),
      success('capture-2', 2_000, []),
      { kind: 'failure', id: 'capture-3', attemptedAt: 3_000, error: { kind: 'server' } },
    ]
    mocks.telemetry = telemetry(history)

    render(
      <Tooltip.Provider delay={0}>
        <QueriesView />
      </Tooltip.Provider>,
    )

    const table = screen.getByRole('table', { name: 'Query subscriptions' })
    expect(within(table).getAllByText(/^\d{2}:\d{2}:\d{2}$/u)).toHaveLength(3)
    expect(within(table).getByRole('button', { name: /^accounts\s*1$/ })).toBeTruthy()
    expect(within(table).getByRole('rowheader', { name: 'accounts-by-name' })).toBeTruthy()
    fireEvent.mouseEnter(within(table).getByText('1'))
    expect(await screen.findByText('Unique query groups observed for this table')).toBeTruthy()
    expect(within(table).getByRole('cell', { name: /was absent/ }).dataset.status).toBe('inactive')
    expect(within(table).getByRole('cell', { name: /was unavailable/ }).dataset.status).toBe(
      'unknown',
    )

    const present = within(table).getByRole('button', {
      name: /Open accounts-by-name at/,
    })
    expect(present.getAttribute('aria-label')).not.toContain('capture-1')
    present.focus()
    fireEvent.click(present)

    expect(present.getAttribute('aria-pressed')).toBe('true')
    const details = screen.getByRole('complementary', { name: 'Query details' })
    expect(within(details).getByText('accounts-by-…')).toBeTruthy()
    expect(within(details).queryByText('accounts-by-name')).toBeNull()
    expect(within(details).getByText('Subscriptions')).toBeTruthy()
    expect(within(details).getByText('2')).toBeTruthy()
    expect(within(details).getByText('Resolved sources')).toBeTruthy()
    expect(within(details).getByText('main')).toBeTruthy()
    expect(within(details).getByText(/\b(?:AM|PM)$/u)).toBeTruthy()
    const queryTree = within(details).getByRole('tree', { name: 'Query JSON' })
    expect(queryTree.textContent).toContain('Ada')

    fireEvent.click(within(details).getByRole('button', { name: 'Close' }))
    expect(document.activeElement).toBe(present)
    expect(screen.queryByRole('complementary', { name: 'Query details' })).toBeNull()
  })

  it('presents schema-qualified branches as one resolved source scope', () => {
    mocks.connection = { ...mocks.connection!, env: 'local-dev' }
    const branches = [
      'local-dev-7f43cb822ba5-main',
      'local-dev-e7ebacf3577c-main',
      'local-dev-d8881b20708b-main',
    ]
    mocks.telemetry = telemetry([success('capture-1', 1_000, [{ ...accountsGroup, branches }])])
    render(<QueriesView />)

    fireEvent.click(screen.getByRole('button', { name: /Open accounts-by-name at/ }))
    const details = screen.getByRole('complementary', { name: 'Query details' })

    expect(within(details).getByText('Resolved sources')).toBeTruthy()
    expect(within(details).getByText('3 schema versions')).toBeTruthy()
    expect(within(details).getByText('Scope')).toBeTruthy()
    expect(within(details).getByText('local-dev / main')).toBeTruthy()
    expect(within(details).getByText('Schema versions')).toBeTruthy()
    expect(within(details).getByText('7f43cb822ba5, e7ebacf3577c, d8881b20708b')).toBeTruthy()
    expect(within(details).queryByText('Branches')).toBeNull()
  })

  it('does not claim an unreported source scope includes every branch', () => {
    mocks.telemetry = telemetry([success('capture-1', 1_000, [{ ...accountsGroup, branches: [] }])])
    render(<QueriesView />)

    fireEvent.click(screen.getByRole('button', { name: /Open accounts-by-name at/ }))
    const details = screen.getByRole('complementary', { name: 'Query details' })

    expect(within(details).getByText('Resolved sources')).toBeTruthy()
    expect(within(details).getByText('Not reported')).toBeTruthy()
    expect(within(details).queryByText('All branches')).toBeNull()
  })

  it('keeps mixed resolved source scopes explicit', () => {
    const branches = ['test-7f43cb822ba5-main', 'test-e7ebacf3577c-feature']
    mocks.telemetry = telemetry([success('capture-1', 1_000, [{ ...accountsGroup, branches }])])
    render(<QueriesView />)

    fireEvent.click(screen.getByRole('button', { name: /Open accounts-by-name at/ }))
    const details = screen.getByRole('complementary', { name: 'Query details' })

    expect(
      within(details).getByText('test-7f43cb822ba5-main, test-e7ebacf3577c-feature'),
    ).toBeTruthy()
    expect(within(details).queryByText('2 schema versions')).toBeNull()
  })

  it('keeps the selected snapshot visible when query details open', () => {
    mocks.telemetry = telemetry([success('capture-1', 1_000, [accountsGroup])])
    render(<QueriesView />)
    const cell = screen.getByRole('button', { name: /Open accounts-by-name at/ })
    const scrollIntoView = vi.fn()
    Object.defineProperty(cell.closest('td'), 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })

    fireEvent.click(cell)

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' })

    scrollIntoView.mockClear()
    mocks.panelResize?.()
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' })
  })

  it('closes query details from the footer action and Escape', () => {
    mocks.telemetry = telemetry([success('capture-1', 1_000, [accountsGroup])])
    render(<QueriesView />)
    const cell = screen.getByRole('button', { name: /Open accounts-by-name at/ })

    fireEvent.click(cell)
    const close = screen.getByRole('button', { name: 'Close' })
    expect(close.getAttribute('aria-keyshortcuts')).toBe('Escape')
    fireEvent.click(close)
    expect(document.activeElement).toBe(cell)

    fireEvent.click(cell)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('complementary', { name: 'Query details' })).toBeNull()
    expect(document.activeElement).toBe(cell)
  })

  it('keeps lane expansion presentational and selection stable as history appends', () => {
    const initialHistory = [success('capture-1', 1_000, [accountsGroup])]
    mocks.telemetry = telemetry(initialHistory)
    const view = render(<QueriesView />)

    fireEvent.click(screen.getByRole('button', { name: /Open accounts-by-name at/ }))
    fireEvent.click(screen.getByRole('button', { name: /^accounts\s*1$/ }))
    expect(
      screen.getByRole('rowheader', { name: 'accounts-by-name', hidden: true }).closest('tr')
        ?.hidden,
    ).toBe(true)

    mocks.telemetry = telemetry([...initialHistory, success('capture-2', 2_000, [accountsGroup])])
    view.rerender(<QueriesView />)

    expect(screen.getByRole('complementary', { name: 'Query details' })).toBeTruthy()
    const selectedCell = screen
      .getAllByRole('button', { name: /Open accounts-by-name at/, hidden: true })
      .find((cell) => cell.getAttribute('aria-pressed') === 'true')
    expect(selectedCell).toBeTruthy()
  })

  it('clears pruned selection and moves focus to refresh', () => {
    const first = success('capture-1', 1_000, [accountsGroup])
    const second = success('capture-2', 2_000, [accountsGroup])
    mocks.telemetry = telemetry([first, second], 'ready')
    const view = render(<QueriesView />)

    const selectedCell = screen.getAllByRole('button', { name: /Open accounts-by-name at/ })[0]!
    fireEvent.click(selectedCell)
    screen.getByRole('button', { name: 'Close' }).focus()

    mocks.telemetry = telemetry([second], 'ready')
    view.rerender(<QueriesView />)

    expect(screen.queryByRole('complementary', { name: 'Query details' })).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Refresh' }))

    mocks.telemetry = telemetry([first, second], 'ready')
    view.rerender(<QueriesView />)
    expect(screen.queryByRole('complementary', { name: 'Query details' })).toBeNull()
    expect(
      screen
        .getAllByRole('button', { name: /Open accounts-by-name at/ })
        .some((cell) => cell.getAttribute('aria-pressed') === 'true'),
    ).toBe(false)
  })

  it('toggles selected cell details through its pressed state', () => {
    mocks.telemetry = telemetry([success('capture-1', 1_000, [accountsGroup])])
    render(<QueriesView />)
    const cell = screen.getByRole('button', { name: /Open accounts-by-name at/ })

    fireEvent.click(cell)
    expect(cell.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(cell)
    expect(cell.getAttribute('aria-pressed')).toBe('false')
    expect(screen.queryByRole('complementary', { name: 'Query details' })).toBeNull()
  })

  it('moves focus to refresh when details close after collapsing the selected lane', () => {
    mocks.telemetry = telemetry([success('capture-1', 1_000, [accountsGroup])])
    render(<QueriesView />)

    fireEvent.click(screen.getByRole('button', { name: /Open accounts-by-name at/ }))
    fireEvent.click(screen.getByRole('button', { name: /^accounts\s*1$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Refresh' }))
  })

  it('resets selected details when stored credentials are replaced', () => {
    mocks.telemetry = telemetry([success('capture-1', 1_000, [accountsGroup])])
    const view = render(<QueriesView />)

    fireEvent.click(screen.getByRole('button', { name: /Open accounts-by-name at/ }))
    mocks.connection = {
      ...mocks.connection!,
      serverUrl: 'https://replacement.example.com',
      appId: 'app-2',
      adminSecret: 'secret-2',
    }
    view.rerender(<QueriesView />)

    expect(screen.queryByRole('complementary', { name: 'Query details' })).toBeNull()
    expect(useQuerySubscriptionsTelemetry).toHaveBeenLastCalledWith(mocks.connection)
  })

  it('keeps query details inside the workspace with a 240px minimum width', () => {
    mocks.telemetry = telemetry([success('capture-1', 1_000, [accountsGroup])])
    render(<QueriesView />)

    fireEvent.click(screen.getByRole('button', { name: /Open accounts-by-name at/ }))

    const details = screen.getByRole('complementary', { name: 'Query details' })
    expect(screen.getByTestId('shell-left-dock')).toBeTruthy()
    expect(screen.queryByTestId('shell-right-dock')).toBeNull()
    expect(details.closest('[data-panel-min-size]')?.getAttribute('data-panel-min-size')).toBe(
      '240',
    )
  })

  it('announces refreshing and stale retained history without replacing the timeline', () => {
    const successful = success('capture-1', 1_000, [accountsGroup])
    mocks.telemetry = telemetry([successful], 'refreshing')
    const view = render(<QueriesView />)
    const toolbar = screen.getByRole('toolbar', { name: 'Query subscription controls' })

    expect(within(toolbar).getByRole('status').textContent).toContain(
      'Refreshing query subscriptions',
    )
    expect(screen.getByRole('table', { name: 'Query subscriptions' })).toBeTruthy()

    mocks.telemetry = telemetry(
      [
        successful,
        { kind: 'failure', id: 'capture-2', attemptedAt: 2_000, error: { kind: 'network' } },
      ],
      'stale-history',
    )
    view.rerender(<QueriesView />)

    expect(screen.getByRole('toolbar', { name: 'Query subscription controls' })).toBe(toolbar)
    expect(within(toolbar).getByRole('alert').textContent).toContain('Showing retained history')
    expect(screen.getByRole('table', { name: 'Query subscriptions' })).toBeTruthy()
  })

  it('refreshes from the persistent timeline toolbar', () => {
    const refresh = vi.fn()
    mocks.telemetry = {
      ...telemetry([success('capture-1', 1_000, [accountsGroup])]),
      refresh,
    }
    render(<QueriesView />)

    fireEvent.click(
      within(screen.getByRole('toolbar', { name: 'Query subscription controls' })).getByRole(
        'button',
        { name: 'Refresh' },
      ),
    )

    expect(refresh).toHaveBeenCalledOnce()
  })

  it('keeps refreshing and failed empty snapshots distinct from confirmed emptiness', () => {
    const empty = success('capture-1', 1_000, [])
    mocks.telemetry = telemetry([empty], 'refreshing')
    const view = render(<QueriesView />)

    expect(screen.getByRole('status').textContent).toContain('Refreshing query subscriptions')

    mocks.telemetry = telemetry(
      [empty, { kind: 'failure', id: 'capture-2', attemptedAt: 2_000, error: { kind: 'network' } }],
      'stale-history',
    )
    view.rerender(<QueriesView />)

    expect(screen.getByRole('alert').textContent).toContain('Showing retained history')
    expect(
      screen.getByText('Last successful snapshot contained no active query subscriptions'),
    ).toBeTruthy()
    expect(screen.queryByText('No active query subscriptions')).toBeNull()
  })
})

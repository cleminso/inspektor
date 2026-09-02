import { StrictMode } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InspectorRuntimeBoundary } from '@app/runtime/inspectorRuntimeBoundary'

const session = vi.hoisted(() => ({
  currentBranch: null as string | null,
  currentConnectionId: null as string | null,
  currentSchemaHash: null as string | null,
  setConnectionContext: vi.fn(),
}))

vi.mock('@app/providers/inspectorSessionProvider', () => ({
  useInspectorSessionContext: () => ({ ...session }),
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  InspectorProvider: ({
    children,
    initialRuntimeTarget,
  }: {
    children: React.ReactNode
    initialRuntimeTarget: { connectionId: string }
  }) => <div data-connection-id={initialRuntimeTarget.connectionId}>{children}</div>,
}))

const target = {
  branch: 'main',
  connectionId: 'connection-1',
  schemaCatalogue: [{ hash: 'schema-1', publishedAt: 1 }],
  schemaHash: 'schema-1',
}

beforeEach(() => {
  session.currentBranch = null
  session.currentConnectionId = null
  session.currentSchemaHash = null
  session.setConnectionContext.mockReset()
  session.setConnectionContext.mockReturnValue('accepted')
})

afterEach(cleanup)

describe('InspectorRuntimeBoundary', () => {
  it('synchronizes the resolved target before mounting runtime-dependent children', () => {
    const { rerender } = render(
      <InspectorRuntimeBoundary fallback={<div>Opening connection</div>} target={target}>
        <div>Runtime content</div>
      </InspectorRuntimeBoundary>,
      { wrapper: StrictMode },
    )

    expect(session.setConnectionContext).toHaveBeenCalledWith('connection-1', 'main', 'schema-1')
    expect(session.setConnectionContext).toHaveBeenCalledOnce()
    expect(screen.queryByText('Runtime content')).toBeNull()
    expect(screen.getByText('Opening connection')).toBeTruthy()

    session.currentBranch = 'main'
    session.currentConnectionId = 'connection-1'
    session.currentSchemaHash = 'schema-1'
    rerender(
      <InspectorRuntimeBoundary fallback={<div>Opening connection</div>} target={target}>
        <div>Runtime content</div>
      </InspectorRuntimeBoundary>,
    )

    expect(screen.getByText('Runtime content')).toBeTruthy()
    expect(screen.queryByText('Opening connection')).toBeNull()
  })

  it('mounts the runtime immediately when the session already matches the target', () => {
    session.currentBranch = 'main'
    session.currentConnectionId = 'connection-1'
    session.currentSchemaHash = 'schema-1'

    render(
      <InspectorRuntimeBoundary target={target}>
        <div>Runtime content</div>
      </InspectorRuntimeBoundary>,
    )

    expect(session.setConnectionContext).not.toHaveBeenCalled()
    expect(screen.getByText('Runtime content')).toBeTruthy()
  })

  it('keeps the runtime mounted after the applied session context changes', () => {
    session.currentBranch = 'main'
    session.currentConnectionId = 'connection-1'
    session.currentSchemaHash = 'schema-1'
    const { rerender } = render(
      <InspectorRuntimeBoundary target={target}>
        <div>Runtime content</div>
      </InspectorRuntimeBoundary>,
    )

    session.currentBranch = 'feature'
    session.currentSchemaHash = 'schema-2'
    rerender(
      <InspectorRuntimeBoundary target={target}>
        <div>Runtime content</div>
      </InspectorRuntimeBoundary>,
    )

    expect(session.setConnectionContext).not.toHaveBeenCalled()
    expect(screen.getByText('Runtime content')).toBeTruthy()
  })

  it('synchronizes a new route target after the previous target was applied', () => {
    session.currentBranch = 'main'
    session.currentConnectionId = 'connection-1'
    session.currentSchemaHash = 'schema-1'
    const { rerender } = render(
      <InspectorRuntimeBoundary target={target}>
        <div>Runtime content</div>
      </InspectorRuntimeBoundary>,
    )

    rerender(
      <InspectorRuntimeBoundary
        target={{ ...target, connectionId: 'connection-2', schemaHash: 'schema-2' }}
      >
        <div>Runtime content</div>
      </InspectorRuntimeBoundary>,
    )

    expect(session.setConnectionContext).toHaveBeenCalledWith('connection-2', 'main', 'schema-2')
    expect(screen.queryByText('Runtime content')).toBeNull()
  })
})

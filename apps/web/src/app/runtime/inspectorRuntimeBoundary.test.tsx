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
})

afterEach(cleanup)

describe('InspectorRuntimeBoundary', () => {
  it('synchronizes the resolved target before mounting runtime-dependent children', () => {
    const { rerender } = render(
      <InspectorRuntimeBoundary target={target}>
        <div>Runtime content</div>
      </InspectorRuntimeBoundary>,
    )

    expect(session.setConnectionContext).toHaveBeenCalledWith('connection-1', 'main', 'schema-1')
    expect(screen.queryByText('Runtime content')).toBeNull()

    session.currentBranch = 'main'
    session.currentConnectionId = 'connection-1'
    session.currentSchemaHash = 'schema-1'
    rerender(
      <InspectorRuntimeBoundary target={target}>
        <div>Runtime content</div>
      </InspectorRuntimeBoundary>,
    )

    expect(screen.getByText('Runtime content')).toBeTruthy()
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

  it('does not mount the runtime when context synchronization is rejected', () => {
    const { rerender } = render(
      <InspectorRuntimeBoundary target={target}>
        <div>Runtime content</div>
      </InspectorRuntimeBoundary>,
    )

    rerender(
      <InspectorRuntimeBoundary target={target}>
        <div>Runtime content</div>
      </InspectorRuntimeBoundary>,
    )

    expect(session.setConnectionContext).toHaveBeenCalledOnce()
    expect(screen.queryByText('Runtime content')).toBeNull()
  })
})

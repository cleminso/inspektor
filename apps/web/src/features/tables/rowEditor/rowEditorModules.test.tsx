import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { Component, type ComponentType, type ReactNode, Suspense } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const importState = vi.hoisted(() => ({ editAttempts: 0, editFailures: 0 }))

vi.mock('./insertForm', () => ({ InsertRowForm: () => 'Insert form' }))

class TestErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render(): ReactNode {
    if (this.state.error === null) {
      return this.props.children
    }
    return this.state.error.cause instanceof Error
      ? this.state.error.cause.message
      : this.state.error.message
  }
}

beforeEach(() => {
  importState.editAttempts = 0
  importState.editFailures = 0
  vi.resetModules()
  vi.doMock('./editForm', () => {
    importState.editAttempts += 1
    if (importState.editFailures > 0) {
      importState.editFailures -= 1
      throw new Error('Edit form import failed')
    }
    return { EditRowForm: () => 'Edit form' }
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('row editor modules', () => {
  it('retries a failed speculative preload', async () => {
    importState.editFailures = 1
    const { preloadRowEditorForms } = await import('./rowEditorModules')

    preloadRowEditorForms()
    await waitFor(() => expect(importState.editAttempts).toBe(1))
    preloadRowEditorForms()

    await waitFor(() => expect(importState.editAttempts).toBe(2))
  })

  it('lets a render-consumed import failure reach an error boundary', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    importState.editFailures = 1
    const { EditRowForm } = await import('./rowEditorModules')
    const TestEditRowForm = EditRowForm as unknown as ComponentType

    render(
      <TestErrorBoundary>
        <Suspense fallback="Loading editor">
          <TestEditRowForm />
        </Suspense>
      </TestErrorBoundary>,
    )

    expect(await screen.findByText('Edit form import failed')).toBeTruthy()
  })
})

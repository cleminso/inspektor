import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RowEditorSidePanel } from '@tables/rowEditor/sidePane'

afterEach(cleanup)

describe('RowEditorSidePanel dirty transitions', () => {
  it('shows the active page row and selected grid column in the edit title', () => {
    render(
      <RowEditorSidePanel
        activeRowIndex={0}
        activePageRowNumber={12}
        activeColumnNumber={3}
        editedRowIds={['row-12']}
        mode="edit"
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    )

    expect(screen.getByRole('heading', { name: 'Edit row 12:3' })).toBeTruthy()
  })

  it('shows column zero when no grid cell is selected', () => {
    render(
      <RowEditorSidePanel
        activeRowIndex={0}
        activePageRowNumber={1}
        activeColumnNumber={0}
        editedRowIds={['row-1']}
        mode="edit"
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    )

    expect(screen.getByRole('heading', { name: 'Edit row 1:0' })).toBeTruthy()
  })

  it('omits page coordinates when the edited row is outside the loaded page', () => {
    render(
      <RowEditorSidePanel
        activeRowIndex={0}
        activePageRowNumber={null}
        activeColumnNumber={0}
        editedRowIds={['row-outside-page']}
        mode="edit"
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    )

    expect(screen.getByRole('heading', { name: 'Edit row' })).toBeTruthy()
  })

  it('renders compact selected-row navigation icons', () => {
    render(
      <RowEditorSidePanel
        activeColumnNumber={0}
        activePageRowNumber={1}
        activeRowIndex={0}
        editedRowIds={['row-1', 'row-2']}
        mode="edit"
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    )

    for (const name of ['Previous selected row', 'Next selected row']) {
      const button = screen.getByRole('button', { name })
      const icon = button.querySelector('[data-slot="icon"]')
      expect(button.getAttribute('data-glyph-size')).toBe('standard')
      expect(icon?.getAttribute('data-size')).toBe('s')
    }
  })

  it('controls whether successful inserts keep the form open', () => {
    const onInsertMoreEnabledChange = vi.fn()
    render(
      <RowEditorSidePanel
        activeColumnNumber={0}
        activePageRowNumber={null}
        activeRowIndex={0}
        editedRowIds={[]}
        mode="insert"
        onInsertMoreEnabledChange={onInsertMoreEnabledChange}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    )

    fireEvent.click(screen.getByRole('switch', { name: 'Insert more' }))

    expect(onInsertMoreEnabledChange).toHaveBeenCalledWith(true)
  })

  it('confirms deletion of the focused row from the edit surface', () => {
    const onConfirmDelete = vi.fn()
    render(
      <RowEditorSidePanel
        activeColumnNumber={0}
        activePageRowNumber={1}
        activeRowIndex={0}
        editedRowIds={['row-1']}
        mode="edit"
        onClose={vi.fn()}
        onConfirmDelete={onConfirmDelete}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete row' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    expect(onConfirmDelete).toHaveBeenCalledWith(['row-1'])
  })

  it('places the edit close action in the footer after the delete action', () => {
    const onClose = vi.fn()
    render(
      <RowEditorSidePanel
        activeColumnNumber={0}
        activePageRowNumber={1}
        activeRowIndex={0}
        editedRowIds={['row-1']}
        mode="edit"
        onClose={onClose}
        onConfirmDelete={() => undefined}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    )

    const closeButton = screen.getByRole('button', { name: 'Close' })
    const footer = closeButton.closest('footer')

    expect(footer).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Delete row' }).compareDocumentPosition(closeButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)

    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps the edit close action when deletion is unavailable', () => {
    const onClose = vi.fn()
    render(
      <RowEditorSidePanel
        activeColumnNumber={0}
        activePageRowNumber={1}
        activeRowIndex={0}
        editedRowIds={['row-1']}
        mode="edit"
        onClose={onClose}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Delete row' })).toBeNull()
  })

  it('names and snapshots every checked row for bulk deletion', () => {
    const onConfirmDelete = vi.fn()
    const { rerender } = render(
      <RowEditorSidePanel
        activeColumnNumber={0}
        activePageRowNumber={1}
        activeRowIndex={0}
        editedRowIds={['row-1', 'row-2', 'row-3']}
        mode="edit"
        onClose={vi.fn()}
        onConfirmDelete={onConfirmDelete}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete 3 checked rows' }))
    rerender(
      <RowEditorSidePanel
        activeColumnNumber={0}
        activePageRowNumber={1}
        activeRowIndex={0}
        editedRowIds={['row-1']}
        mode="edit"
        onClose={vi.fn()}
        onConfirmDelete={onConfirmDelete}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    expect(onConfirmDelete).toHaveBeenCalledWith(['row-1', 'row-2', 'row-3'])
  })
})

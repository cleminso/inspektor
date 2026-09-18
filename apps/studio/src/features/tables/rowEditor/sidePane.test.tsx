import { Tooltip } from '@inspektor/ds'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppHotkeysProvider } from '@app/hotkeys/appHotkeys'
import { RowEditorSidePanel } from '@tables/rowEditor/sidePane'

afterEach(cleanup)

describe('RowEditorSidePanel dirty transitions', () => {
  it('orders row navigation as J then K and follows held keys in edit mode', async () => {
    const onNavigateNext = vi.fn()
    const onNavigatePrevious = vi.fn()
    render(
      <Tooltip.Provider delay={0}>
        <AppHotkeysProvider>
          <RowEditorSidePanel
            canNavigateNext
            canNavigatePrevious
            editedRowIds={['row-12']}
            mode="edit"
            navigationLabel="12 / 101+"
            onNavigateNext={onNavigateNext}
            onNavigatePrevious={onNavigatePrevious}
          >
            <input aria-label="Row value" />
          </RowEditorSidePanel>
        </AppHotkeysProvider>
      </Tooltip.Provider>,
    )

    expect(fireEvent.keyDown(document, { key: 'k' })).toBe(false)
    expect(fireEvent.keyDown(document, { key: 'j' })).toBe(false)
    expect(fireEvent.keyDown(document, { key: 'k', repeat: true })).toBe(false)
    expect(fireEvent.keyDown(document, { key: 'j', repeat: true })).toBe(false)
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Row value' }), { key: 'j' })

    expect(onNavigatePrevious).toHaveBeenCalledTimes(2)
    expect(onNavigateNext).toHaveBeenCalledTimes(2)
    expect(
      screen.getAllByRole('button').map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Next row', 'Previous row'])
    expect(screen.getByText('12 / 101+')).toBeTruthy()

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Previous row' }))
    expect(await screen.findByText('Previous row K')).toBeTruthy()
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'Previous row' }))
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Next row' }))
    expect(await screen.findByText('Next row J')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /^Edit row/ })).toBeNull()
  })

  it('controls whether successful inserts keep the form open', () => {
    const onInsertMoreEnabledChange = vi.fn()
    render(
      <RowEditorSidePanel
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

  it('disables Insert more while table mutations are applying', () => {
    render(
      <RowEditorSidePanel
        editedRowIds={[]}
        mode="insert"
        mutationDisabled
        onInsertMoreEnabledChange={vi.fn()}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    )

    expect(screen.getByRole('switch', { name: 'Insert more' }).getAttribute('aria-disabled')).toBe(
      'true',
    )
  })

  it('confirms deletion of the focused row from the edit surface', () => {
    const onConfirmDelete = vi.fn()
    render(
      <RowEditorSidePanel
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
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    expect(onConfirmDelete).toHaveBeenCalledWith(['row-1'])
  })

  it('places the edit close action in the footer after the delete action', () => {
    const onClose = vi.fn()
    render(
      <RowEditorSidePanel
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
        editedRowIds={['row-1']}
        mode="edit"
        mutationDisabled
        onClose={vi.fn()}
        onConfirmDelete={onConfirmDelete}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>,
    )
    const confirmDelete = screen.getByRole('button', { name: 'Confirm delete' })
    expect((confirmDelete as HTMLButtonElement).disabled).toBe(true)

    rerender(
      <RowEditorSidePanel
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
    fireEvent.click(confirmDelete)

    expect(onConfirmDelete).toHaveBeenCalledWith(['row-1', 'row-2', 'row-3'])
  })

  it('clears pending deletion when the pane mode changes', () => {
    const onConfirmDelete = vi.fn()
    const renderPanel = (mode: 'edit' | 'insert', editedRowIds: string[]) => (
      <RowEditorSidePanel
        editedRowIds={editedRowIds}
        mode={mode}
        onClose={vi.fn()}
        onConfirmDelete={onConfirmDelete}
        onNavigateNext={() => undefined}
        onNavigatePrevious={() => undefined}
      >
        <div />
      </RowEditorSidePanel>
    )
    const { rerender } = render(renderPanel('edit', ['row-1']))
    fireEvent.click(screen.getByRole('button', { name: 'Delete row' }))

    rerender(renderPanel('insert', []))
    rerender(renderPanel('edit', ['row-2']))
    fireEvent.click(screen.getByRole('button', { name: 'Delete row' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    expect(onConfirmDelete).toHaveBeenCalledWith(['row-2'])
  })
})

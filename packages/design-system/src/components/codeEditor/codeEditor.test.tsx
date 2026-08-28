import { Transaction } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { CodeEditor } from './codeEditor'

beforeAll(() => import('./codeMirrorEditor'))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const longJson = JSON.stringify(
  {
    alpha: 1,
    beta: 2,
    gamma: 3,
    delta: 4,
    epsilon: 5,
    zeta: 6,
    eta: 7,
    theta: 8,
    iota: 9,
  },
  null,
  2,
)

function renderOverflowingEditor(props: Partial<React.ComponentProps<typeof CodeEditor>> = {}) {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(240)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(120)

  return render(<CodeEditor accessibilityLabel="Settings JSON" value={longJson} {...props} />)
}

async function findCodeMirrorTextbox(name = 'Settings JSON'): Promise<HTMLElement> {
  return waitFor(() => {
    const editor = screen.getByRole('textbox', { name })
    if (EditorView.findFromDOM(editor) === null) {
      throw new Error('CodeMirror editor is not ready')
    }

    return editor
  })
}

describe('CodeEditor', () => {
  it('honors explicit mount focus unless the editor is disabled', async () => {
    const value = '{"enabled":true}'
    const { unmount } = render(
      <CodeEditor accessibilityLabel="Settings JSON" focusOnMount value={value} />,
    )

    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Settings JSON' }))
    const codeMirrorTextbox = await findCodeMirrorTextbox()
    expect(document.activeElement).toBe(codeMirrorTextbox)
    expect(EditorView.findFromDOM(codeMirrorTextbox)?.state.selection.main.anchor).toBe(
      value.length,
    )
    unmount()
    render(
      <CodeEditor
        accessibilityLabel="Settings JSON"
        disabled
        focusOnMount
        value={'{"enabled":true}'}
      />,
    )

    const disabledEditor = await findCodeMirrorTextbox()

    expect(document.activeElement).not.toBe(disabledEditor)
  })

  it('restores focus when CodeMirror replaces the static editor', async () => {
    render(<CodeEditor accessibilityLabel="Settings JSON" value={'{"enabled":true}'} />)

    const staticEditor = screen.getByRole('textbox', { name: 'Settings JSON' })
    staticEditor.focus()

    const editor = await findCodeMirrorTextbox()

    expect(document.activeElement).toBe(editor)
  })

  it('does not reclaim focus when focus moves before CodeMirror loads', async () => {
    render(
      <>
        <CodeEditor accessibilityLabel="Settings JSON" focusOnMount value={'{"enabled":true}'} />
        <button type="button">Outside action</button>
      </>,
    )

    const outsideAction = screen.getByRole('button', { name: 'Outside action' })
    outsideAction.focus()
    await findCodeMirrorTextbox()

    expect(document.activeElement).toBe(outsideAction)
  })

  it('starts later mounts from the resolved CodeMirror implementation', async () => {
    const first = render(
      <CodeEditor accessibilityLabel="Settings JSON" value={'{"enabled":true}'} />,
    )
    await findCodeMirrorTextbox()
    first.unmount()

    render(
      <CodeEditor accessibilityLabel="Settings JSON" focusOnMount value={'{"enabled":true}'} />,
    )

    const editor = screen.getByRole('textbox', { name: 'Settings JSON' })
    expect(EditorView.findFromDOM(editor)).not.toBeNull()
    expect(document.activeElement).toBe(editor)
  })

  it('focuses long expanded intrinsic content from the start', async () => {
    const value = Array.from({ length: 20 }, (_, index) => `line ${index}`).join('\n')

    render(<CodeEditor accessibilityLabel="Settings JSON" expanded focusOnMount value={value} />)

    const editor = await findCodeMirrorTextbox()

    expect(EditorView.findFromDOM(editor)?.state.selection.main.anchor).toBe(0)
  })

  it('projects controlled content and accessibility states into CodeMirror', async () => {
    const { rerender } = render(
      <CodeEditor accessibilityLabel="Settings JSON" invalid readOnly value={'{"enabled":true}'} />,
    )

    const editor = await findCodeMirrorTextbox()

    expect(editor.getAttribute('aria-multiline')).toBe('true')
    expect(editor.getAttribute('aria-readonly')).toBe('true')
    expect(editor.getAttribute('aria-invalid')).toBe('true')
    expect(editor.textContent).toContain('"enabled"')
    expect(editor.textContent).toContain('true')

    rerender(<CodeEditor accessibilityLabel="Settings JSON" disabled value={'{"enabled":true}'} />)

    expect(
      screen
        .getByRole('textbox', { name: 'Settings JSON', hidden: true })
        .getAttribute('aria-disabled'),
    ).toBe('true')
  })

  it('formats the live editor document and returns focus to it', async () => {
    const onValueChange = vi.fn()

    render(
      <CodeEditor
        accessibilityLabel="Settings JSON"
        value={'{"stale":true}'}
        onValueChange={onValueChange}
      />,
    )

    const editor = await findCodeMirrorTextbox()
    const editorView = EditorView.findFromDOM(editor)

    expect(editorView).not.toBeNull()
    editorView?.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: '{"live":true}',
      },
      selection: { anchor: 7 },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Format JSON' }))

    expect(onValueChange).toHaveBeenLastCalledWith('{\n  "live": true\n}')
    expect(editorView?.state.selection.main.anchor).toBe(7)
    expect(document.activeElement).toBe(editor)
    expect(editorView?.scrollDOM.scrollTop).toBe(0)
  })

  it('shows line numbers and fold controls', async () => {
    render(<CodeEditor accessibilityLabel="Settings JSON" value={longJson} />)

    const editor = await findCodeMirrorTextbox()
    const editorRoot = editor.closest('[data-slot="code-editor"]')
    const foldMarker = await waitFor(() => {
      const marker = editorRoot?.querySelector(
        '[data-slot="code-editor-fold-marker"][data-state="expanded"]',
      )
      if (marker === null || marker === undefined) {
        throw new Error('Fold marker is not ready')
      }

      return marker
    })

    expect(editorRoot?.querySelector('.cm-lineNumbers')).not.toBeNull()
    expect(editorRoot?.querySelector('.cm-foldGutter')).not.toBeNull()
    expect(foldMarker?.getAttribute('title')).toBeNull()
    expect(foldMarker?.getAttribute('aria-label')).toBe('Fold line')
  })

  it('shows the document beginning when paste replaces the whole source', async () => {
    const onValueChange = vi.fn()

    render(<CodeEditor accessibilityLabel="Settings JSON" value="" onValueChange={onValueChange} />)

    const editor = await findCodeMirrorTextbox()
    const editorView = EditorView.findFromDOM(editor)

    expect(editorView).not.toBeNull()
    if (editorView === null) {
      return
    }

    const scrollIntoView = vi.spyOn(EditorView, 'scrollIntoView')

    editorView.scrollDOM.scrollTop = 72
    editorView.dispatch({
      annotations: Transaction.userEvent.of('input.paste'),
      changes: { from: 0, to: editorView.state.doc.length, insert: longJson },
      scrollIntoView: true,
      selection: { anchor: longJson.length },
    })

    expect(editorView.state.selection.main.anchor).toBe(0)
    expect(scrollIntoView).toHaveBeenCalledWith(0, { y: 'start' })
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(longJson)
  })

  it('keeps formatting available and ignores invalid JSON', async () => {
    const onValueChange = vi.fn()

    render(
      <CodeEditor accessibilityLabel="Settings JSON" value="{" onValueChange={onValueChange} />,
    )

    const format = await screen.findByRole('button', { name: 'Format JSON' })

    fireEvent.click(format)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('remeasures disclosure after wrapping changes and observed resizing', async () => {
    let scrollHeight = 240
    let clientHeight = 120
    const resizeCallbacks: Array<() => void> = []

    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => scrollHeight)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => clientHeight)
    class ResizeObserverMock implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(() => {
          callback([], this)
        })
      }

      disconnect(): void {}
      observe(): void {}
      unobserve(): void {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)

    render(<CodeEditor accessibilityLabel="Settings JSON" value={longJson} />)

    expect(await screen.findByRole('button', { name: 'Expand code editor' })).toBeDefined()

    scrollHeight = 120
    clientHeight = 120
    fireEvent.click(screen.getByRole('button', { name: 'Disable line wrapping' }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Expand code editor' })).toBeNull()
    })

    scrollHeight = 240
    for (const resize of resizeCallbacks) {
      resize()
    }

    expect(await screen.findByRole('button', { name: 'Expand code editor' })).toBeDefined()
  })

  it('renders one integrated disclosure action and preserves the textbox instance', async () => {
    renderOverflowingEditor()

    const editor = await findCodeMirrorTextbox()
    const expand = await screen.findByRole('button', { name: 'Expand code editor' })

    expect(expand.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(expand)

    expect(screen.getByRole('textbox', { name: 'Settings JSON' })).toBe(editor)
    screen.getByRole('button', { name: 'Collapse code editor' })

    fireEvent.click(screen.getByRole('button', { name: 'Collapse code editor' }))

    screen.getByRole('button', { name: 'Expand code editor' })
    expect(screen.getByRole('textbox', { name: 'Settings JSON' })).toBe(editor)
  })

  it('keeps compact and expanded scroll positions separate', async () => {
    renderOverflowingEditor()

    const editor = await findCodeMirrorTextbox()
    const editorView = EditorView.findFromDOM(editor)

    fireEvent.click(await screen.findByRole('button', { name: 'Expand code editor' }))
    if (editorView !== null) {
      editorView.scrollDOM.scrollTop = 72
    }
    fireEvent.click(screen.getByRole('button', { name: 'Collapse code editor' }))

    expect(editorView?.scrollDOM.scrollTop).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: 'Expand code editor' }))
    expect(editorView?.scrollDOM.scrollTop).toBe(72)
  })

  it('reports controlled presentation changes', async () => {
    const onExpandedChange = vi.fn()

    renderOverflowingEditor({ expanded: false, onExpandedChange })

    fireEvent.click(await screen.findByRole('button', { name: 'Expand code editor' }))

    expect(onExpandedChange).toHaveBeenCalledWith(true)
    screen.getByRole('button', { name: 'Expand code editor' })
  })

  it('exposes a constrained fill layout only while expanded', async () => {
    const { rerender } = render(
      <CodeEditor accessibilityLabel="Settings JSON" layout="fill" value={longJson} />,
    )

    const editor = await findCodeMirrorTextbox()
    const root = editor.closest('[data-slot="code-editor"]')

    expect(root?.getAttribute('data-layout')).toBe('intrinsic')

    rerender(
      <CodeEditor accessibilityLabel="Settings JSON" expanded layout="fill" value={longJson} />,
    )

    expect(root?.getAttribute('data-layout')).toBe('fill')
  })

  it('reports wrapping state, returns focus, and resets horizontal scroll', async () => {
    render(<CodeEditor accessibilityLabel="Settings JSON" value={longJson} />)

    const editor = await findCodeMirrorTextbox()
    const editorView = EditorView.findFromDOM(editor)
    const wrap = screen.getByRole('button', { name: 'Disable line wrapping' })

    expect(wrap.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(wrap)

    const enableWrapping = screen.getByRole('button', { name: 'Enable line wrapping' })
    expect(enableWrapping.getAttribute('aria-pressed')).toBe('false')
    if (editorView !== null) {
      editorView.scrollDOM.scrollLeft = 80
    }
    fireEvent.click(enableWrapping)

    await waitFor(() => {
      expect(editorView?.scrollDOM.scrollLeft).toBe(0)
    })
    expect(document.activeElement).toBe(editor)
  })
})

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./codeMirrorEditor', () => new Promise(() => {}))

import { CodeEditor } from './codeEditor'

afterEach(cleanup)

describe('CodeEditor loading boundary', () => {
  it('keeps editing usable while CodeMirror loads', () => {
    const onValueChange = vi.fn()

    render(
      <CodeEditor
        accessibilityLabel="Settings JSON"
        value={'{"enabled":true}'}
        onValueChange={onValueChange}
      />,
    )

    const editor = screen.getByRole('textbox', { name: 'Settings JSON' })
    expect((editor as HTMLTextAreaElement).value).toBe('{"enabled":true}')

    fireEvent.change(editor, { target: { value: '{"enabled":false}' } })

    expect(onValueChange).toHaveBeenCalledWith('{"enabled":false}')
  })

  it('reserves the expanded intrinsic presentation while CodeMirror loads', () => {
    const value = Array.from({ length: 20 }, (_, index) => `line ${index}`).join('\n')

    render(<CodeEditor accessibilityLabel="Settings JSON" expanded value={value} />)

    const editor = screen.getByRole('textbox', { name: 'Settings JSON' })
    const root = editor.closest('[data-slot="code-editor"]')

    expect(root?.getAttribute('data-expanded')).toBe('')
    expect(root?.getAttribute('data-layout')).toBe('intrinsic')
    expect(root?.querySelector('[data-slot="code-editor-viewport"]')).toContain(editor)
    expect(root?.querySelector('[data-slot="code-editor-toolbar"]')).toBeTruthy()
    expect((editor as HTMLTextAreaElement).rows).toBe(18)
    expect(editor.getAttribute('data-viewport-capped')).toBe('')
  })

  it('fills its parent instead of applying the intrinsic viewport cap', () => {
    const value = Array.from({ length: 20 }, (_, index) => `line ${index}`).join('\n')

    render(<CodeEditor accessibilityLabel="Settings JSON" expanded layout="fill" value={value} />)

    const editor = screen.getByRole('textbox', { name: 'Settings JSON' })
    const root = editor.closest('[data-slot="code-editor"]')

    expect(root?.getAttribute('data-layout')).toBe('fill')
    expect(editor.getAttribute('data-viewport-capped')).toBeNull()
  })
})

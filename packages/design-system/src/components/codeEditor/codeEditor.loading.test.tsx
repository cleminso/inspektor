import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('./codeMirrorEditor', () => new Promise(() => {}))

import { CodeEditor } from './codeEditor'

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
})

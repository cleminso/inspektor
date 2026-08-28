import { describe, expect, it, vi } from 'vitest'

const codeMirrorModuleLoaded = vi.hoisted(() => vi.fn())

vi.mock('./codeMirrorEditor', () => {
  codeMirrorModuleLoaded()

  return { CodeMirrorEditor: () => null }
})

import { preloadCodeEditor } from './codeEditor'

describe('CodeEditor module boundary', () => {
  it('does not initialize CodeMirror when the static editor is imported', () => {
    expect(codeMirrorModuleLoaded).not.toHaveBeenCalled()
  })

  it('initializes CodeMirror through the explicit preload boundary', async () => {
    await preloadCodeEditor()

    expect(codeMirrorModuleLoaded).toHaveBeenCalledOnce()
  })
})

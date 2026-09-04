import { describe, expect, it, vi } from 'vitest'

const codeMirrorModuleLoads = vi.hoisted(() => ({ count: 0 }))

vi.mock('./codeMirrorEditor', () => {
  codeMirrorModuleLoads.count += 1

  return { CodeMirrorEditor: () => null }
})

import { preloadCodeEditor } from './codeEditor'

describe('CodeEditor module boundary', () => {
  it('does not initialize CodeMirror when the static editor is imported', () => {
    expect(codeMirrorModuleLoads.count).toBe(0)
  })

  it('initializes CodeMirror through the explicit preload boundary', async () => {
    await preloadCodeEditor()

    expect(codeMirrorModuleLoads.count).toBe(1)
  })
})

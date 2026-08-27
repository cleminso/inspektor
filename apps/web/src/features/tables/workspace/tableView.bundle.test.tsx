import { describe, expect, it, vi } from 'vitest'

const codeMirrorModuleLoaded = vi.hoisted(() => vi.fn())

vi.mock('@codemirror/view', () => {
  codeMirrorModuleLoaded()

  return {}
})

import './tableView'

describe('TableView module boundary', () => {
  it('does not initialize CodeMirror when the base table view is imported', () => {
    expect(codeMirrorModuleLoaded).not.toHaveBeenCalled()
  })
})

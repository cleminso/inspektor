import { describe, expect, it, vi } from 'vitest'

const codeMirrorModuleLoads = vi.hoisted(() => ({ count: 0 }))

vi.mock('@inspektor/ds', () => ({}))

vi.mock('@codemirror/view', () => {
  codeMirrorModuleLoads.count += 1

  return {}
})

import './tableView'

describe('TableView module boundary', () => {
  it('does not initialize CodeMirror when the base table view is imported', () => {
    expect(codeMirrorModuleLoads.count).toBe(0)
  })
})

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ResizablePanel } from './resizablePanel'

const upstream = vi.hoisted(() => ({
  defaultSize: undefined as number | string | undefined,
}))

vi.mock('react-resizable-panels', () => ({
  Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Panel: ({
    children,
    defaultSize,
  }: {
    children?: React.ReactNode
    defaultSize?: number | string
  }) => {
    upstream.defaultSize = defaultSize
    return <div>{children}</div>
  },
  Separator: () => <div />,
  useDefaultLayout: vi.fn(),
  useGroupCallbackRef: vi.fn(),
  useGroupRef: vi.fn(),
  usePanelCallbackRef: vi.fn(),
  usePanelRef: vi.fn(),
}))

afterEach(() => {
  cleanup()
  upstream.defaultSize = undefined
})

describe('ResizablePanel', () => {
  it.each([
    { collapsible: true, defaultSize: 200, name: 'collapsible' },
    { collapsible: false, defaultSize: undefined, name: 'non-collapsible' },
  ])('projects the $name panel default size', ({ collapsible, defaultSize }) => {
    render(<ResizablePanel collapsible={collapsible} />)

    expect(upstream.defaultSize).toBe(defaultSize)
  })
})

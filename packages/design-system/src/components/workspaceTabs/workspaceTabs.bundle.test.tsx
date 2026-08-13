import { describe, expect, it, vi } from 'vitest'

const pointerSensorConfigure = vi.hoisted(() => vi.fn(() => ({})))

vi.mock('@dnd-kit/dom', () => ({
  AutoScroller: { configure: () => ({}) },
  Feedback: { configure: () => ({}) },
  PointerActivationConstraints: {
    Distance: class Distance {
      constructor(_options: { value: number }) {}
    },
  },
  PointerSensor: { configure: pointerSensorConfigure },
}))

import './workspaceTabs'

describe('WorkspaceTabs module boundary', () => {
  it('does not initialize drag-and-drop when static tabs are imported', () => {
    expect(pointerSensorConfigure).not.toHaveBeenCalled()
  })
})

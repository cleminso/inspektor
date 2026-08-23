import { describe, expect, it, vi } from 'vitest'

const pointerSensorConfigure = vi.hoisted(() => vi.fn(() => ({})))

vi.mock('@dnd-kit/dom', () => ({
  AutoScroller: { configure: () => ({}) },
  PointerActivationConstraints: {
    Distance: class Distance {
      constructor(_options: { value: number }) {}
    },
  },
  PointerSensor: { configure: pointerSensorConfigure },
}))

import './dataGrid'

describe('DataGrid module boundary', () => {
  it('does not initialize drag-and-drop when the static table is imported', () => {
    expect(pointerSensorConfigure).not.toHaveBeenCalled()
  })
})

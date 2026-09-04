import { describe, expect, it, vi } from 'vitest'

const pointerSensorConfigureCalls = vi.hoisted(() => ({ count: 0 }))

vi.mock('@dnd-kit/dom', () => ({
  AutoScroller: { configure: () => ({}) },
  PointerActivationConstraints: {
    Distance: class Distance {
      constructor(_options: { value: number }) {}
    },
  },
  PointerSensor: {
    configure: () => {
      pointerSensorConfigureCalls.count += 1
      return {}
    },
  },
}))

import './dataGrid'

describe('DataGrid module boundary', () => {
  it('does not initialize drag-and-drop when the static table is imported', () => {
    expect(pointerSensorConfigureCalls.count).toBe(0)
  })
})

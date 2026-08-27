import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BranchSwitcher } from './branchSwitcher'

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentBranch: 'feature/checkout',
    rememberedBranches: ['feature/checkout'],
    switchBranch: vi.fn(),
  }),
}))

describe('BranchSwitcher', () => {
  it('excludes branch names from translation', () => {
    render(<BranchSwitcher />)
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Switch branch' }), {
      key: 'ArrowDown',
    })

    for (const branchName of screen.getAllByText('feature/checkout')) {
      expect(branchName.closest('[translate="no"]')).toBeTruthy()
    }
  })
})

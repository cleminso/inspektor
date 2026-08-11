import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BranchSwitcher } from './branchSwitcher'

vi.mock('@inspector/ds', () => {
  const Part = ({ children, translate }: { children?: React.ReactNode; translate?: 'no' }) => (
    <div translate={translate}>{children}</div>
  )
  const List = ({
    children,
  }: {
    children?: React.ReactNode | ((value: string) => React.ReactNode)
  }) => <div>{typeof children === 'function' ? children('feature/checkout') : children}</div>
  return {
    ContextSwitcher: {
      Root: Part,
      Trigger: Part,
      Content: Part,
      Search: Part,
      Viewport: Part,
      Empty: Part,
      List,
      Item: Part,
      ItemText: ({ label, translate }: { label: string; translate?: 'no' }) => (
        <span translate={translate}>{label}</span>
      ),
    },
    Text: Part,
  }
})

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

    for (const branchName of screen.getAllByText('feature/checkout')) {
      expect(branchName.closest('[translate="no"]')).toBeTruthy()
    }
  })
})

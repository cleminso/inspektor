import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { copyButtonItem } from '@/lib/registry'

import CopyButtonContent from './page.mdx'

describe('Copy Button documentation', () => {
  it('renders the exact value with a named copy action', () => {
    render(
      <ComponentPage item={copyButtonItem}>
        <CopyButtonContent />
      </ComponentPage>,
    )

    expect(screen.getByText('sha256:41f17cc82ca')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy schema hash' })).toBeTruthy()
  })
})

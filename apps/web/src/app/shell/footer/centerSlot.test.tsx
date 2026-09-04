import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  InspectorFooterCenterPortal,
  InspectorFooterCenterProvider,
  InspectorFooterCenterSlot,
} from './centerSlot'

afterEach(cleanup)

describe('InspectorFooterCenterPortal', () => {
  it('places descendant controls in the footer center slot', async () => {
    render(
      <InspectorFooterCenterProvider>
        <InspectorFooterCenterPortal>
          <button type="button">Staged changes</button>
        </InspectorFooterCenterPortal>
        <footer>
          <InspectorFooterCenterSlot />
        </footer>
      </InspectorFooterCenterProvider>,
    )

    const trigger = await screen.findByRole('button', { name: 'Staged changes' })
    expect(trigger.closest('[data-slot="inspektor-footer-center"]')).toBeTruthy()
    expect(trigger.closest('footer')).toBeTruthy()
  })
})

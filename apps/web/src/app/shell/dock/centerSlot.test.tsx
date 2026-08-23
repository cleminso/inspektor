import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  InspectorDockCenterPortal,
  InspectorDockCenterProvider,
  InspectorDockCenterSlot,
} from './centerSlot'

afterEach(cleanup)

describe('InspectorDockCenterPortal', () => {
  it('places descendant controls in the dock center slot', async () => {
    render(
      <InspectorDockCenterProvider>
        <InspectorDockCenterPortal>
          <button type="button">Staged changes</button>
        </InspectorDockCenterPortal>
        <footer>
          <InspectorDockCenterSlot />
        </footer>
      </InspectorDockCenterProvider>,
    )

    const trigger = await screen.findByRole('button', { name: 'Staged changes' })
    expect(trigger.closest('[data-slot="inspector-dock-center"]')).toBeTruthy()
    expect(trigger.closest('footer')).toBeTruthy()
  })
})

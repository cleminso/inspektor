import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConnectionsLayout } from './connectionsLayout'

const prepareJazzWasm = vi.hoisted(() => vi.fn(() => Promise.resolve()))

vi.mock('@app/runtime/jazzWasmPreparation', () => ({
  prepareJazzWasm,
}))

vi.mock('@shared/connections/connectionSwitcher', () => ({
  ConnectionSwitcher: () => <button type="button">Open connection</button>,
}))

afterEach(cleanup)

describe('ConnectionsLayout', () => {
  it('starts shared Jazz WASM preparation after the onboarding shell commits', async () => {
    render(
      <ConnectionsLayout pageTitle="Connections">
        <div>Content</div>
      </ConnectionsLayout>,
    )

    await vi.waitFor(() => expect(prepareJazzWasm).toHaveBeenCalledOnce())
  })

  it('provides a skip link and a focusable titled main landmark', () => {
    render(
      <ConnectionsLayout pageTitle="Connections">
        <div>Content</div>
      </ConnectionsLayout>,
    )

    const skipLink = screen.getByRole('link', { name: 'Skip to content' })
    const main = screen.getByRole('main')

    expect(skipLink.getAttribute('href')).toBe('#main-content')
    expect(main.getAttribute('id')).toBe('main-content')
    expect(main.getAttribute('tabindex')).toBe('-1')
    expect(screen.getByRole('heading', { level: 1, name: 'Connections' })).toBeTruthy()
    expect(main.closest('[data-slot="shell-layout-view"]')).toBeTruthy()
    expect(screen.getByRole('banner').closest('[data-slot="shell-layout-header"]')).toBeTruthy()
    expect(skipLink.compareDocumentPosition(screen.getByRole('banner'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })
})

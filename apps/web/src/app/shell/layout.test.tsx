import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppHotkeysProvider } from '@app/hotkeys/appHotkeys'

import { InspectorLayout } from './layout'

vi.mock('./header/view', () => ({
  InspectorHeader: () => <header>Header</header>,
}))

afterEach(cleanup)

function renderLayout(): ReturnType<typeof render> {
  return render(
    <AppHotkeysProvider>
      <InspectorLayout pageTitle="Tables">
        <div>Content</div>
      </InspectorLayout>
    </AppHotkeysProvider>,
  )
}

describe('InspectorLayout', () => {
  it('provides a skip link and a focusable titled main landmark', () => {
    renderLayout()

    const skipLink = screen.getByRole('link', { name: 'Skip to content' })
    const main = screen.getByRole('main')

    expect(skipLink.getAttribute('href')).toBe('#main-content')
    expect(main.getAttribute('id')).toBe('main-content')
    expect(main.getAttribute('tabindex')).toBe('-1')
    expect(screen.getByRole('heading', { level: 1, name: 'Tables' })).toBeTruthy()
  })
})

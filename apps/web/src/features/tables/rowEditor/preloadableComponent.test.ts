import { cleanup, render, screen } from '@testing-library/react'
import { createElement, Suspense } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { createPreloadableComponent } from './preloadableComponent'

afterEach(cleanup)

describe('createPreloadableComponent', () => {
  it('renders a completed preload without showing the suspense fallback', async () => {
    let resolveModule!: (module: { default: typeof LoadedComponent }) => void
    const LoadedComponent = ({ label }: { label: string }) => label
    const preloadable = createPreloadableComponent<{ label: string }>(
      () =>
        new Promise<{ default: typeof LoadedComponent }>((resolve) => {
          resolveModule = resolve
        }),
    )

    const preload = preloadable.preload()
    resolveModule({ default: LoadedComponent })
    await preload

    render(
      createElement(
        Suspense,
        { fallback: 'Loading editor' },
        createElement(preloadable.Component, { label: 'Editor ready' }),
      ),
    )

    expect(screen.getByText('Editor ready')).toBeTruthy()
    expect(screen.queryByText('Loading editor')).toBeNull()
  })
})

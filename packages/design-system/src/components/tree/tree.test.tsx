import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef, forwardRef, type ComponentPropsWithRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Tree } from './tree'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const RouterLink = forwardRef<HTMLAnchorElement, ComponentPropsWithRef<'a'>>(
  function RouterLink(props, ref) {
    return <a {...props} ref={ref} data-router-link="" />
  },
)

describe('Tree', () => {
  it('connects expandable sections with composed navigation items', () => {
    const itemRef = createRef<HTMLAnchorElement>()

    render(
      <Tree.Root aria-label="Design system navigation">
        <Tree.Section defaultOpen>
          <Tree.Trigger>Foundations</Tree.Trigger>
          <Tree.Content>
            <Tree.Item
              ref={itemRef}
              render={<RouterLink href="/foundations/colors" />}
              aria-current="page"
            >
              Colors
            </Tree.Item>
          </Tree.Content>
        </Tree.Section>
      </Tree.Root>,
    )

    const folder = screen.getByRole('button', { name: 'Foundations' })
    const currentLink = screen.getByRole('link', { name: 'Colors' })

    expect(screen.getByRole('navigation', { name: 'Design system navigation' })).toBeTruthy()
    expect(folder.getAttribute('aria-expanded')).toBe('true')
    expect(currentLink.getAttribute('aria-current')).toBe('page')
    expect(currentLink.hasAttribute('data-router-link')).toBe(true)
    expect(itemRef.current).toBe(currentLink)

    fireEvent.click(folder)

    expect(folder.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('link', { name: 'Colors' })).toBeNull()
  })

  it('keeps one current-item indicator while navigation changes within a section', () => {
    function Navigation({ current }: { current: 'colors' | 'typography' }) {
      return (
        <Tree.Root aria-label="Design system navigation">
          <Tree.Section defaultOpen>
            <Tree.Trigger>Foundations</Tree.Trigger>
            <Tree.Content>
              <Tree.Item href="/colors" aria-current={current === 'colors' ? 'page' : undefined}>
                Colors
              </Tree.Item>
              <Tree.Item
                href="/typography"
                aria-current={current === 'typography' ? 'page' : undefined}
              >
                Typography
              </Tree.Item>
            </Tree.Content>
          </Tree.Section>
        </Tree.Root>
      )
    }

    const { container, rerender } = render(<Navigation current="colors" />)
    const indicator = container.querySelector('[data-slot="tree-current-indicator"]')

    expect(indicator).toBeTruthy()

    rerender(<Navigation current="typography" />)

    expect(container.querySelector('[data-slot="tree-current-indicator"]')).toBe(indicator)
  })

  it('repositions the current-item indicator when section content resizes', () => {
    let handleResize: ResizeObserverCallback | undefined
    let observedElement: Element | undefined

    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          handleResize = callback
        }

        observe(element: Element): void {
          observedElement = element
        }
        unobserve(): void {}
        disconnect(): void {}
      },
    )

    const { container } = render(
      <Tree.Root aria-label="Design system navigation">
        <Tree.Section>
          <Tree.Trigger>Foundations</Tree.Trigger>
          <Tree.Content>
            <Tree.Item href="/colors" aria-current="page">
              Colors
            </Tree.Item>
          </Tree.Content>
        </Tree.Section>
      </Tree.Root>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Foundations' }))

    const currentItem = screen.getByRole('link', { name: 'Colors' }).closest('li')
    const indicator = container.querySelector<HTMLElement>('[data-slot="tree-current-indicator"]')

    expect(currentItem).not.toBeNull()
    expect(observedElement).toBe(currentItem?.parentElement)
    expect(indicator?.style.transform).toBe('translateY(0px)')

    Object.defineProperty(currentItem, 'offsetTop', { configurable: true, value: 24 })
    act(() => handleResize?.([], {} as ResizeObserver))

    expect(indicator?.style.transform).toBe('translateY(24px)')
  })
})

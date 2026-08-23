import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const styles = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

describe('workspace scrollbar ownership', () => {
  it('leaves scrollbar appearance and gutters to design-system scroll containers', () => {
    expect(styles).not.toContain('scrollbar-gutter')
    expect(styles).not.toContain('scrollbar-width')
    expect(styles).not.toContain('::-webkit-scrollbar')
  })

  it('fades scrolled documentation beneath the fixed header', () => {
    expect(styles).toContain('@property --docs-scroll-fade-top')
    expect(styles).toContain('[data-scroll-fade="top"]')
    expect(styles).toContain('animation-timeline: scroll(self y)')
    expect(styles).toContain('animation-range: 0 64px')
    expect(styles).toContain('mask-image: linear-gradient')
  })
})

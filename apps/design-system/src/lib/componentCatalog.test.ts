import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { docsSections } from './registry'

const routeModules = import.meta.glob('../routes/components/*.tsx')
const contentModules = import.meta.glob('../content/components/*/page.mdx')
const demoModules = import.meta.glob('../content/components/*/demos/*.tsx')

function toCamelCase(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, character: string) => character.toUpperCase())
}

describe('component documentation catalog', () => {
  it('pairs every registered component with a stable route, authored page, and executable demo', () => {
    const componentSection = docsSections.find((section) => section.title === 'Components')
    if (componentSection === undefined) {
      throw new TypeError('Expected a Components documentation section')
    }

    expect(Object.keys(routeModules)).toHaveLength(componentSection.items.length)
    expect(Object.keys(contentModules)).toHaveLength(componentSection.items.length)

    for (const item of componentSection.items) {
      const contentDirectory = toCamelCase(item.slug)
      const demoPrefix = `../content/components/${contentDirectory}/demos/`
      const routePath = `../routes/components/${item.slug}.tsx`
      const contentPath = `../content/components/${contentDirectory}/page.mdx`
      const routeSource = readFileSync(new URL(routePath, import.meta.url), 'utf8')
      const pageSource = readFileSync(new URL(contentPath, import.meta.url), 'utf8')

      expect(routeModules[routePath]).toBeDefined()
      expect(contentModules[contentPath]).toBeDefined()
      expect(Object.keys(demoModules).some((path) => path.startsWith(demoPrefix))).toBe(true)
      expect(routeSource).toContain(`@/content/components/${contentDirectory}/page.mdx`)
      expect(routeSource).toContain(`{ ${contentDirectory}Item }`)

      for (const demoPath of Object.keys(demoModules).filter((path) =>
        path.startsWith(demoPrefix),
      )) {
        const demoName = demoPath.slice(demoPrefix.length, -'.tsx'.length)
        expect(pageSource).toContain(`./demos/${demoName}'`)
        expect(pageSource).toContain(`./demos/${demoName}.tsx?raw'`)
      }
    }
  })
})

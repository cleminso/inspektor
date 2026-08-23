import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

interface DirectLucideJsxViolation {
  filePath: string
  iconName: string
}

function findDirectLucideJsxViolations(
  filePath: string,
  source: string,
): DirectLucideJsxViolation[] {
  const violations: DirectLucideJsxViolation[] = []
  const importPattern = /import\s+(\{[^}]*\}|[^;\n]+)\s+from\s+["']lucide-react["'];?/g

  for (const match of source.matchAll(importPattern)) {
    const bindings = match[1]?.trim()
    if (bindings === undefined || bindings.startsWith('{') === false) {
      continue
    }

    for (const binding of bindings.slice(1, -1).split(',')) {
      const importedName = binding
        .trim()
        .split(/\s+as\s+/)
        .at(-1)
      if (importedName === undefined || importedName === '') {
        continue
      }

      const directJsxPattern = new RegExp(`<\\s*${importedName}(?:\\s|/|>)`)
      if (directJsxPattern.test(source)) {
        violations.push({ filePath, iconName: importedName })
      }
    }
  }

  return violations
}

function getTsxFiles(directoryPath: string): string[] {
  return readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directoryPath, entry.name)
    if (entry.isDirectory() === true) {
      return getTsxFiles(entryPath)
    }
    return entry.name.endsWith('.tsx') ? [entryPath] : []
  })
}

describe('application icon policy', () => {
  it('detects directly rendered named Lucide imports', () => {
    const violations = findDirectLucideJsxViolations(
      'fixture.tsx',
      'import { Search } from "lucide-react"; export const Fixture = () => <Search />;',
    )

    expect(violations).toEqual([{ filePath: 'fixture.tsx', iconName: 'Search' }])
  })

  it('detects directly rendered aliased Lucide imports', () => {
    const violations = findDirectLucideJsxViolations(
      'fixture.tsx',
      'import { Search as SearchIcon } from "lucide-react"; export const Fixture = () => <SearchIcon />;',
    )

    expect(violations).toEqual([{ filePath: 'fixture.tsx', iconName: 'SearchIcon' }])
  })

  it('accepts Lucide artwork passed through a constrained glyph boundary', () => {
    const violations = findDirectLucideJsxViolations(
      'fixture.tsx',
      'import { Search } from "lucide-react"; export const Fixture = () => <Icon artwork={Search} />;',
    )

    expect(violations).toEqual([])
  })

  it('accepts namespace artwork passed through a constrained glyph boundary', () => {
    const violations = findDirectLucideJsxViolations(
      'fixture.tsx',
      'import * as Icons from "lucide-react"; export const Fixture = () => <Icon artwork={Icons.Search} />;',
    )

    expect(violations).toEqual([])
  })

  it('keeps direct named Lucide JSX rendering behind an artwork prop', () => {
    const sourceDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
    const violations = getTsxFiles(sourceDirectory).flatMap((filePath) =>
      findDirectLucideJsxViolations(filePath, readFileSync(filePath, 'utf8')),
    )

    expect(violations).toEqual([])
  })
})

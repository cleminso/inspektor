import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..')

test('rejects direct Lucide JSX and accepts Lucide values', () => {
  const fixtures = mkdtempSync(join(root, 'apps/web/src/.no-direct-lucide-jsx-'))
  const fixture = join(fixtures, 'fixture.tsx')

  try {
    writeFileSync(
      fixture,
      `import { Icon } from '@inspector/ds'
import { Search, X as Close } from 'lucide-react'
import * as Icons from 'lucide-react'
const localArtwork = Search
export const Valid = () => <Icon artwork={localArtwork ?? Close ?? Icons.Menu} />
export const Invalid = () => <Wrapper artwork={Search}><Search /><Close /><Icons.Menu /></Wrapper>
`,
    )

    const invalidResult = spawnSync(
      'pnpm',
      ['exec', 'oxlint', '--format', 'json', fixture],
      { cwd: root, encoding: 'utf8' },
    )
    assert.equal(invalidResult.status, 1, invalidResult.stderr || invalidResult.stdout)
    assert.equal(
      JSON.parse(invalidResult.stdout).diagnostics.filter(
        ({ code }) => code === 'anti-slop(no-direct-lucide-jsx)',
      ).length,
      3,
    )
  } finally {
    rmSync(fixtures, { recursive: true, force: true })
  }
})

import { describe, expect, it } from 'vitest'

import { createPlaygroundSource } from './playgroundSource'

describe('createPlaygroundSource', () => {
  it('formats design-system imports and a JSX example', () => {
    expect(
      createPlaygroundSource({
        imports: { Button: true, Spinner: false },
        example: '<Button>Save</Button>',
      }),
    ).toBe(
      'import { Button } from "@inspektor/ds";\n\nexport default function Example() {\n  return <Button>Save</Button>;\n}',
    )
  })

  it('preserves import order and separates declarations from the example', () => {
    expect(
      createPlaygroundSource({
        imports: { Select: true, Field: true },
        declarations: 'const options = ["main", "develop"];',
        example: '(\n    <Select.Root items={options} />\n  )',
      }),
    ).toBe(
      'import { Select, Field } from "@inspektor/ds";\n\nconst options = ["main", "develop"];\n\nexport default function Example() {\n  return (\n    <Select.Root items={options} />\n  );\n}',
    )
  })
})

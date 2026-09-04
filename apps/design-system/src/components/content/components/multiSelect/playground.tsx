import { MultiSelect, type MultiSelectItem } from '@inspektor/ds'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { multiSelectItem } from '@/lib/registry'

const options: readonly MultiSelectItem[] = [
  { value: 'design-system', label: 'Design System', disabled: true },
  { value: 'components', label: 'Components' },
  { value: 'design-tokens', label: 'Design Tokens' },
]

const sourceCode = `const [value, setValue] = useState(["design-system", "components"]);

<MultiSelect.Root items={options} value={value} onValueChange={setValue}>
  <MultiSelect.Trigger label="Choose options">
    {value.length === options.length ? "All options selected" : \`${'${value.length}'} options selected\`}
  </MultiSelect.Trigger>
  <MultiSelect.Content label="Options" />
</MultiSelect.Root>`

export function MultiSelectPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [value, setValue] = useState(['design-system', 'components'])
  const triggerLabel =
    value.length === options.length ? 'All options selected' : `${value.length} options selected`
  const preview = (
    <MultiSelect.Root
      items={options}
      value={value}
      onValueChange={setValue}
    >
      <MultiSelect.Trigger label="Choose options">{triggerLabel}</MultiSelect.Trigger>
      <MultiSelect.Content label="Options" />
    </MultiSelect.Root>
  )

  return (
    <ComponentDocsPage
      title={multiSelectItem.title}
      description={multiSelectItem.description}
      source={multiSelectItem.source}
      preview={preview}
      sourceCode={sourceCode}
    >
      {children}
    </ComponentDocsPage>
  )
}

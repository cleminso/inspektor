import { CheckboxGroup, type CheckboxGroupItem } from '@inspektor/ds'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { checkboxGroupItem } from '@/lib/registry'

const items: readonly CheckboxGroupItem[] = [
  { value: 'id', label: 'ID', disabled: true },
  { value: 'name', label: 'Name' },
  { value: 'role', label: 'Role' },
]

const sourceCode = `const [value, setValue] = useState(["id", "name"]);

<CheckboxGroup.Root items={items} value={value} onValueChange={setValue}>
  <CheckboxGroup.List label="Visible fields" />
</CheckboxGroup.Root>`

export function CheckboxGroupPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [value, setValue] = useState(['id', 'name'])
  const preview = (
    <CheckboxGroup.Root
      items={items}
      value={value}
      onValueChange={setValue}
    >
      <CheckboxGroup.List label="Visible fields" />
    </CheckboxGroup.Root>
  )

  return (
    <ComponentDocsPage
      title={checkboxGroupItem.title}
      description={checkboxGroupItem.description}
      source={checkboxGroupItem.source}
      preview={preview}
      sourceCode={sourceCode}
    >
      {children}
    </ComponentDocsPage>
  )
}

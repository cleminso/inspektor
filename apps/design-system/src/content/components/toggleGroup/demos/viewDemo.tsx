import { ToggleGroup } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function ToggleGroupViewDemo(): ReactElement {
  return (
    <ToggleGroup
      defaultValue={['tables']}
      aria-label="Data view"
    >
      <ToggleGroup.Item value="tables">Tables</ToggleGroup.Item>
      <ToggleGroup.Item value="subscriptions">Subscriptions</ToggleGroup.Item>
    </ToggleGroup>
  )
}

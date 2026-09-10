import { Box, ToggleGroup } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function ToggleGroupMultipleDemo(): ReactElement {
  return (
    <Box width="popup-width-m">
      <ToggleGroup
        defaultValue={['columns', 'relationships']}
        aria-label="Visible schema details"
        itemWidth="equal"
        multiple
        size="m"
        width="full"
      >
        <ToggleGroup.Item value="columns">Columns</ToggleGroup.Item>
        <ToggleGroup.Item value="relationships">Relations</ToggleGroup.Item>
        <ToggleGroup.Item value="permissions">Permissions</ToggleGroup.Item>
      </ToggleGroup>
    </Box>
  )
}

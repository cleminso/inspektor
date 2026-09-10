import { Box, Text } from '@inspektor/ds'
import { type BackgroundColorToken } from '@inspektor/ds/theme'
import { type ReactElement } from 'react'

const colorRoles = [
  { label: 'Background', token: 'surface-background' },
  { label: 'Default surface', token: 'surface-default' },
  { label: 'Raised surface', token: 'surface-raised' },
  { label: 'Subtle surface', token: 'surface-subtle' },
  { label: 'Selected element', token: 'element-selected' },
  { label: 'Accent element', token: 'accent-element-default' },
  { label: 'Danger element', token: 'danger-element-default' },
] as const satisfies readonly { label: string; token: BackgroundColorToken }[]

export function ColorRoles(): ReactElement {
  return (
    <Box
      display="grid"
      gridTemplateColumns="auto-fit-s"
      gap="m"
    >
      {colorRoles.map((role) => (
        <Box
          key={role.token}
          flexDirection="column"
          gap="s"
          padding="m"
          borderWidth={1}
          borderStyle="solid"
          borderColor="default"
          borderRadius="m"
        >
          <Box
            aria-hidden="true"
            height="panel-bar-height"
            backgroundColor={role.token}
            borderWidth={1}
            borderStyle="solid"
            borderColor="subtle"
            borderRadius="s"
          />
          <Text variant="label">{role.label}</Text>
          <Text
            as="code"
            variant="caption"
            color="muted"
            monospace
          >
            {role.token}
          </Text>
        </Box>
      ))}
    </Box>
  )
}

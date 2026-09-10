import { Box, Text, type TextVariant } from '@inspektor/ds'
import { type ReactElement } from 'react'

const roles = [
  { variant: 'heading', sample: 'Section heading' },
  { variant: 'title', sample: 'Interface title' },
  { variant: 'body', sample: 'Body text explains product behavior and guidance.' },
  { variant: 'label', sample: 'Control label' },
  { variant: 'caption', sample: 'Supporting caption' },
  { variant: 'default', sample: 'Default interface text' },
] as const satisfies readonly { variant: TextVariant; sample: string }[]

export function TypeRoles(): ReactElement {
  return (
    <Box
      flexDirection="column"
      borderWidth={1}
      borderStyle="solid"
      borderColor="default"
      borderRadius="m"
      overflow="hidden"
    >
      {roles.map((role) => (
        <Box
          key={role.variant}
          alignItems="baseline"
          gap="xl"
          padding="l"
          borderBottomWidth={1}
          borderStyle="solid"
          borderColor="default"
        >
          <Text
            as="code"
            variant="caption"
            color="muted"
            monospace
          >
            {role.variant}
          </Text>
          <Text variant={role.variant}>{role.sample}</Text>
        </Box>
      ))}
    </Box>
  )
}

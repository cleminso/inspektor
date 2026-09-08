import { Box, Text } from '@inspektor/ds'
import { createContext, type ReactElement, type ReactNode, use } from 'react'
import { createPortal } from 'react-dom'

export const AppShellDetailsTargetContext = createContext<HTMLElement | null | undefined>(undefined)

export function AppShellDetails({
  children,
  description,
  label,
}: {
  children?: ReactNode
  description?: string
  label: string
}): ReactElement | null {
  const target = use(AppShellDetailsTargetContext)

  if (target === null) {
    return null
  }

  const details = (
    <Box
      as="aside"
      aria-label={label}
      width="full"
      minHeight={0}
      flexDirection="column"
      gap="2xl"
      data-scrollable="false"
    >
      {description !== undefined ? (
        <Text
          variant="body"
          color="muted"
        >
          {description}
        </Text>
      ) : null}
      {children}
    </Box>
  )

  return target === undefined ? details : createPortal(details, target)
}

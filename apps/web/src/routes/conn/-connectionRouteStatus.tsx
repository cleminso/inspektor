// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { Box, Button, Text } from '@inspektor/ds'
import { useTheme } from 'next-themes'

import { normalizeSchemaFetchError } from '@app/connections/connectionValidation'

export function ConnectionRouteLoading(): React.ReactElement {
  const { resolvedTheme } = useTheme()
  const wordmarkSrc =
    resolvedTheme === 'dark'
      ? '/brand/inspektorWordmarkOnDark.png'
      : '/brand/inspektorWordmarkOnLight.png'

  return (
    <Box
      position="fixed"
      inset="none"
      zIndex="overlay"
      width="full"
      height="screen-height-dynamic"
      alignItems="center"
      justifyContent="center"
      backgroundColor="surface-background"
      role="status"
      aria-label="Loading"
      aria-live="polite"
      aria-atomic="true"
    >
      <img
        src={wordmarkSrc}
        width="160"
        height="23"
        alt=""
        aria-hidden="true"
      />
    </Box>
  )
}

export function ConnectionRouteError({ error }: ErrorComponentProps): React.ReactElement {
  const router = useRouter()
  const connectionError = normalizeSchemaFetchError(error)

  return (
    <Box
      flex={1}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="xs"
      role="alert"
    >
      <Text
        variant="label"
        color="error"
      >
        {connectionError.title}
      </Text>
      <Text color="muted">{connectionError.description}</Text>
      <Button
        type="button"
        size="s"
        variant="secondary"
        onClick={() => void router.invalidate()}
      >
        Try again
      </Button>
    </Box>
  )
}

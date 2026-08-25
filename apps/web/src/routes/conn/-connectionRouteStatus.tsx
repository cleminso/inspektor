// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { Box, Button, Text } from '@inspector/ds'

import { normalizeSchemaFetchError } from '@app/connections/connectionValidation'

export function ConnectionRoutePending(): React.ReactElement {
  return (
    <Box
      flex={1}
      alignItems="center"
      justifyContent="center"
      role="status"
    >
      <Text color="muted">Opening connection…</Text>
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

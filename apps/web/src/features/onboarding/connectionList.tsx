import { Box, Button, Text } from '@inspektor/ds'

import { useInspectorSessionContext } from '@app/providers/inspectorSessionProvider'
import { getConnectionDisplayName } from '@app/connections/connections'

export function ConnectionList(): React.ReactElement {
  const { connections, openConnection } = useInspectorSessionContext()

  return (
    <Box
      width="full"
      flexDirection="column"
      gap="xxs"
    >
      {connections.map((connection) => (
        <Button
          key={connection.id}
          type="button"
          variant="ghost"
          size="xs"
          layout="stacked"
          aria-label={`${getConnectionDisplayName(connection)} ${connection.appId}`}
          onClick={() => {
            openConnection(connection.id)
          }}
        >
          <Text
            as="span"
            variant="default"
            color="inherit"
          >
            {getConnectionDisplayName(connection)}
          </Text>
          <Text
            as="span"
            variant="caption"
            color="muted"
            truncate
          >
            {connection.appId}
          </Text>
        </Button>
      ))}
    </Box>
  )
}

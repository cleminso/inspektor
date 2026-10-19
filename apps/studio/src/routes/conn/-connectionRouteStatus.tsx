// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { useEffect, useState } from 'react'
import { Link, useParams, type ErrorComponentProps } from '@tanstack/react-router'
import { Box, Button, ButtonLink, Text } from '@inspektor/ds'
import { useTheme } from 'next-themes'

import {
  beginAutomaticConnectionRecovery,
  reloadConnectionPage,
} from '@app/connections/connectionRecovery'
import { appRoutes } from '@app/routing/appRoutes'

interface ConnectionRouteLoadingProps {
  message?: string
}

export function ConnectionRouteLoading({
  message = 'Loading connection…',
}: ConnectionRouteLoadingProps): React.ReactElement {
  const { resolvedTheme } = useTheme()
  const wordmarkSrc =
    resolvedTheme === 'dark'
      ? '/conn/brand/inspektorWordmarkOnDark.png'
      : '/conn/brand/inspektorWordmarkOnLight.png'

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
      aria-live="polite"
      aria-atomic="true"
    >
      <Box
        flexDirection="column"
        alignItems="center"
        gap="m"
      >
        <img
          src={wordmarkSrc}
          width="160"
          height="23"
          alt=""
          aria-hidden="true"
        />
        <Text color="muted">{message}</Text>
      </Box>
    </Box>
  )
}

export function ConnectionRouteError(_props: ErrorComponentProps): React.ReactElement {
  const { connectionId } = useParams({ from: appRoutes.connection })
  const [isRecoveringAutomatically, setIsRecoveringAutomatically] = useState(true)

  const reconnect = () => {
    beginAutomaticConnectionRecovery()
    reloadConnectionPage()
  }

  useEffect(() => {
    const recoverAutomatically = () => {
      if (beginAutomaticConnectionRecovery() === false) {
        setIsRecoveringAutomatically(false)
        return
      }

      setIsRecoveringAutomatically(true)
      reloadConnectionPage()
    }

    recoverAutomatically()
  }, [])

  if (isRecoveringAutomatically === true) {
    return <ConnectionRouteLoading message="Reconnecting…" />
  }

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
      padding="l"
      role="alert"
    >
      <Box
        width="full"
        maxWidth="popup-width-l"
        flexDirection="column"
        alignItems="center"
        gap="m"
        textAlign="center"
      >
        <Box
          flexDirection="column"
          gap="xs"
          alignItems="center"
        >
          <Text
            as="h1"
            variant="heading"
            color="error"
          >
            Connection interrupted
          </Text>
          <Text
            color="muted"
            align="center"
          >
            Inspektor couldn't restore this connection automatically. Try reconnecting or update its
            saved details.
          </Text>
        </Box>
        <Box
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="center"
          gap="s"
        >
          <ButtonLink
            size="s"
            variant="primary"
            render={
              <Link
                to={appRoutes.editConnection}
                params={{ connectionId }}
              />
            }
          >
            Edit connection
          </ButtonLink>
          <Button
            type="button"
            size="s"
            variant="secondary"
            onClick={reconnect}
          >
            Reconnect
          </Button>
          <ButtonLink
            size="s"
            variant="ghost"
            render={<Link to={appRoutes.connections} />}
          >
            Back to connections
          </ButtonLink>
        </Box>
      </Box>
    </Box>
  )
}

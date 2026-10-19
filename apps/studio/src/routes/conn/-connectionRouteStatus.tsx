// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { useEffect, useState } from 'react'
import { Link, useParams, type ErrorComponentProps } from '@tanstack/react-router'
import { Accordion, Box, Button, ButtonLink, CopyButton, Text } from '@inspektor/ds'
import { useTheme } from 'next-themes'

import {
  getSchemaCatalogueDiagnostics,
  isSchemaCatalogueNetworkError,
  normalizeSchemaFetchError,
} from '@app/connections/connectionValidation'
import {
  beginAutomaticConnectionRecovery,
  reloadConnectionPage,
} from '@app/connections/connectionRecovery'
import { appRoutes } from '@app/routing/appRoutes'

export function ConnectionRouteLoading(): React.ReactElement {
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

function canRecoverConnectionAutomatically(error: unknown): boolean {
  const diagnostics = getSchemaCatalogueDiagnostics(error)
  return (
    diagnostics === null ||
    (isSchemaCatalogueNetworkError(error) === true && diagnostics.browserNetwork === 'Online')
  )
}

export function ConnectionRouteError({ error }: ErrorComponentProps): React.ReactElement {
  const { connectionId } = useParams({ from: appRoutes.connection })
  const diagnostics = getSchemaCatalogueDiagnostics(error)
  const connectionError =
    diagnostics === null
      ? {
          title: 'Connection interrupted',
          description:
            "Inspektor couldn't restore this connection automatically. Try reconnecting.",
        }
      : normalizeSchemaFetchError(error)
  const retryWhenOnline = isSchemaCatalogueNetworkError(error)
  const recoverImmediately = canRecoverConnectionAutomatically(error)
  const [isRecoveringAutomatically, setIsRecoveringAutomatically] = useState(recoverImmediately)
  const diagnosticLines =
    diagnostics === null
      ? []
      : [
          `Stage: ${diagnostics.stage}`,
          `Server: ${diagnostics.server}`,
          `Response: ${diagnostics.response}`,
          `Attempts: ${diagnostics.attempts}`,
          `Browser network: ${diagnostics.browserNetwork}`,
        ]
  const diagnosticText = diagnosticLines.join('\n')

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

    if (canRecoverConnectionAutomatically(error) === true) {
      recoverAutomatically()
    } else {
      setIsRecoveringAutomatically(false)
    }

    if (retryWhenOnline === false) return

    window.addEventListener('online', recoverAutomatically)
    return () => window.removeEventListener('online', recoverAutomatically)
  }, [error, retryWhenOnline])

  if (isRecoveringAutomatically === true) return <ConnectionRouteLoading />

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
            {connectionError.title}
          </Text>
          <Text
            color="muted"
            align="center"
          >
            {connectionError.description}
          </Text>
          {retryWhenOnline === true ? (
            <Text
              color="muted"
              align="center"
            >
              If this server runs on your device or local network, check that your browser allows
              this site to access the local network, then reconnect.
            </Text>
          ) : null}
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
        {diagnostics === null ? null : (
          <Box
            width="full"
            textAlign="left"
          >
            <Accordion>
              <Accordion.Item value="technical-details">
                <Accordion.Header level={2}>
                  <Accordion.Trigger>Technical details</Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>
                  <Box
                    flexDirection="row"
                    alignItems="start"
                    gap="xs"
                    paddingBottom="s"
                  >
                    <Box
                      flex={1}
                      flexDirection="column"
                      gap="xxs"
                      userSelect="text"
                    >
                      {diagnosticLines.map((line) => (
                        <Text
                          key={line}
                          variant="caption"
                          monospace
                        >
                          {line}
                        </Text>
                      ))}
                    </Box>
                    <CopyButton
                      label="Copy technical details"
                      textToCopy={diagnosticText}
                      size="s"
                      variant="secondary"
                    />
                  </Box>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Box>
        )}
      </Box>
    </Box>
  )
}

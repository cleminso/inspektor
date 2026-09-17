import { useEffect, useRef, type FormEventHandler } from 'react'

import { Box, Button, Checkbox, Fieldset, Text, TextField } from '@inspektor/ds'

import type { ConnectionError } from '@app/connections/connectionValidation'
import type { CredentialRetention } from '@app/connections/connections'

import type { ConnectionFormValues } from './connectionFormTypes'

interface ConnectionFormProps {
  error: ConnectionError | null
  formValues: ConnectionFormValues
  isSubmitting: boolean
  onCancel: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  onFieldValueChange: (
    field: Exclude<keyof ConnectionFormValues, 'credentialRetention'>,
    value: string,
  ) => void
  onCredentialRetentionChange: (credentialRetention: CredentialRetention) => void
}

export function ConnectionForm({
  error,
  formValues,
  isSubmitting,
  onCancel,
  onSubmit,
  onFieldValueChange,
  onCredentialRetentionChange,
}: ConnectionFormProps): React.ReactElement {
  const serverUrlRef = useRef<HTMLInputElement>(null)
  const appIdRef = useRef<HTMLInputElement>(null)
  const adminSecretRef = useRef<HTMLInputElement>(null)
  const errorField = error?.field

  useEffect(() => {
    if (errorField === 'serverUrl') {
      serverUrlRef.current?.focus()
    } else if (errorField === 'appId') {
      appIdRef.current?.focus()
    } else if (errorField === 'adminSecret') {
      adminSecretRef.current?.focus()
    }
  }, [errorField])

  return (
    <Box
      as="form"
      minHeight={0}
      width="full"
      flexDirection="column"
      gap="2xl"
      noValidate
      onSubmit={onSubmit}
    >
      <Fieldset.Root>
        <TextField
          id="connection-name"
          label="Connection name"
          name="name"
          autoComplete="off"
          value={formValues.name}
          onValueChange={(value) => {
            onFieldValueChange('name', value)
          }}
          placeholder="my Jazz app…"
        />
        <TextField
          id="connection-server-url"
          label="Server URL"
          name="serverUrl"
          autoComplete="url"
          description="The server that synchronizes and stores this app's data."
          error={error?.field === 'serverUrl' ? error.description : undefined}
          validate={(value) =>
            String(value ?? '').trim().length > 0 ? null : 'Enter a server URL.'
          }
          ref={serverUrlRef}
          type="url"
          inputMode="url"
          spellCheck={false}
          value={formValues.serverUrl}
          onValueChange={(value) => {
            onFieldValueChange('serverUrl', value)
          }}
          placeholder="https://v2.sync.jazz.tools/"
          aria-required={true}
        />
        <TextField
          id="connection-app-id"
          label="Jazz app ID"
          name="appId"
          autoComplete="off"
          error={error?.field === 'appId' ? error.description : undefined}
          validate={(value) =>
            String(value ?? '').trim().length > 0 ? null : 'Enter a Jazz app ID.'
          }
          ref={appIdRef}
          spellCheck={false}
          value={formValues.appId}
          onValueChange={(value) => {
            onFieldValueChange('appId', value)
          }}
          aria-required={true}
        />
        <TextField
          id="connection-admin-secret"
          label="Admin secret"
          name="adminSecret"
          autoComplete="current-password"
          error={error?.field === 'adminSecret' ? error.description : undefined}
          validate={(value) =>
            String(value ?? '').trim().length > 0 ? null : 'Enter an admin secret.'
          }
          ref={adminSecretRef}
          type="password"
          spellCheck={false}
          value={formValues.adminSecret}
          onValueChange={(value) => {
            onFieldValueChange('adminSecret', value)
          }}
          aria-required={true}
        />
        <Checkbox.Label layout="row">
          <Box
            flex={1}
            flexDirection="column"
            gap="xs"
            minWidth={0}
          >
            <Text variant="label">Store admin secret in sessionStorage</Text>
            <Text color="muted">
              By default, secret is kept in memory, so the connection is lost on refresh.
              This option uses sessionStorage so connection survives refresh in this tab.
            </Text>
          </Box>
          <Checkbox
            name="credentialRetention"
            checked={formValues.credentialRetention === 'session'}
            onCheckedChange={(checked) => {
              onCredentialRetentionChange(checked === true ? 'session' : 'memory')
            }}
          />
        </Checkbox.Label>
        <TextField
          id="connection-env"
          label="Environment"
          name="env"
          autoComplete="off"
          spellCheck={false}
          value={formValues.env}
          onValueChange={(value) => {
            onFieldValueChange('env', value)
          }}
        />
      </Fieldset.Root>
      {error !== null && error.field === undefined ? (
        <Box
          flexDirection="column"
          gap="xs"
          role="status"
          aria-live="polite"
        >
          <Text
            color="error"
            variant="label"
          >
            {error.title}
          </Text>
          <Text color="error">{error.description}</Text>
        </Box>
      ) : null}
      <Box
        alignItems="center"
        gap="m"
      >
        <Box flex={1}>
          <Button
            type="submit"
            size="m"
            layout="fill"
            disabled={isSubmitting === true}
            loading={isSubmitting === true}
          >
            Save connection
          </Button>
        </Box>
        <Box flex={1}>
          <Button
            type="button"
            variant="secondary"
            size="m"
            layout="fill"
            onClick={onCancel}
            disabled={isSubmitting === true}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

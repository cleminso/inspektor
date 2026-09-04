import { useEffect, useRef, type FormEventHandler } from 'react'

import { Box, Button, Fieldset, Text, TextField } from '@inspector/ds'

import type { ConnectionError } from '@app/connections/connectionValidation'

import type { AddConnectionFormValues } from './connectionFormTypes'

interface AddConnectionFormProps {
  error: ConnectionError | null
  formValues: AddConnectionFormValues
  isSubmitting: boolean
  mode?: 'add' | 'edit'
  onCancel: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  onUpdateField: (field: keyof AddConnectionFormValues, value: string) => void
}

export function AddConnectionForm({
  error,
  formValues,
  isSubmitting,
  mode = 'add',
  onCancel,
  onSubmit,
  onUpdateField,
}: AddConnectionFormProps): React.ReactElement {
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
      <Fieldset.Root disabled={isSubmitting}>
        <TextField
          id="connection-name"
          label="Connection name"
          name="name"
          autoComplete="off"
          value={formValues.name}
          onValueChange={(value) => {
            onUpdateField('name', value)
          }}
          placeholder="my Jazz app…"
        />
        <TextField
          id="connection-server-url"
          label="Server URL"
          name="serverUrl"
          autoComplete="url"
          description="Sync server that stores your app data."
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
            onUpdateField('serverUrl', value)
          }}
          placeholder="https://v2.sync.jazz.tools/"
          aria-required={true}
        />
        <TextField
          id="connection-app-id"
          label="App ID"
          name="appId"
          autoComplete="off"
          error={error?.field === 'appId' ? error.description : undefined}
          validate={(value) => (String(value ?? '').trim().length > 0 ? null : 'Enter an app ID.')}
          ref={appIdRef}
          spellCheck={false}
          value={formValues.appId}
          onValueChange={(value) => {
            onUpdateField('appId', value)
          }}
          aria-required={true}
        />
        <TextField
          id="connection-admin-secret"
          label="Admin secret"
          name="adminSecret"
          autoComplete="off"
          error={error?.field === 'adminSecret' ? error.description : undefined}
          validate={(value) =>
            String(value ?? '').trim().length > 0 ? null : 'Enter an admin secret.'
          }
          ref={adminSecretRef}
          type="password"
          spellCheck={false}
          value={formValues.adminSecret}
          onValueChange={(value) => {
            onUpdateField('adminSecret', value)
          }}
          aria-required={true}
        />
        <Box
          display="grid"
          gridTemplateColumns={{ base: 'one', sm: 'two' }}
          gap="m"
        >
          <TextField
            id="connection-env"
            label="Env"
            name="env"
            autoComplete="off"
            spellCheck={false}
            value={formValues.env}
            onValueChange={(value) => {
              onUpdateField('env', value)
            }}
          />
          <TextField
            id="connection-branch"
            label="Branch"
            name="branch"
            autoComplete="off"
            spellCheck={false}
            value={formValues.branch}
            onValueChange={(value) => {
              onUpdateField('branch', value)
            }}
          />
        </Box>
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
            size="s"
            layout="fill"
            disabled={isSubmitting === true}
            loading={isSubmitting === true}
          >
            {mode === 'edit' ? 'Save connection' : 'Add connection'}
          </Button>
        </Box>
        <Box flex={1}>
          <Button
            type="button"
            variant="secondary"
            size="s"
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

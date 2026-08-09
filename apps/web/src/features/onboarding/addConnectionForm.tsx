import { useState } from "react";

import { Box, Button, Text, TextField } from "@inspector/ds";

import type { ConnectionError } from "@app/connections/connectionValidation";

import type { AddConnectionFormValues } from "./connectionFormTypes";

type FormSubmitHandler = NonNullable<React.ComponentProps<"form">["onSubmit"]>;

interface AddConnectionFormProps {
  error: ConnectionError | null;
  formValues: AddConnectionFormValues;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: FormSubmitHandler;
  onUpdateField: (field: keyof AddConnectionFormValues, value: string) => void;
}

export function AddConnectionForm({
  error,
  formValues,
  isSubmitting,
  onCancel,
  onSubmit,
  onUpdateField,
}: AddConnectionFormProps): React.ReactElement {
  const hasError = error !== null;
  const canSubmit =
    formValues.serverUrl.trim().length > 0 &&
    formValues.appId.trim().length > 0 &&
    formValues.adminSecret.trim().length > 0;
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof AddConnectionFormValues, boolean>>
  >({});
  const isFieldInvalid = (field: keyof AddConnectionFormValues) =>
    touchedFields[field] === true && formValues[field].trim().length === 0;
  const markFieldTouched = (field: keyof AddConnectionFormValues) => {
    setTouchedFields((currentFields) => ({ ...currentFields, [field]: true }));
  };
  const markRequiredFieldsTouched = () => {
    setTouchedFields((currentFields) => ({
      ...currentFields,
      serverUrl: true,
      appId: true,
      adminSecret: true,
    }));
  };

  const handleSubmit: FormSubmitHandler = (event) => {
    markRequiredFieldsTouched();
    onSubmit(event);
  };

  return (
    <Box
      as="form"
      minHeight={0}
      width="full"
      flexDirection="column"
      gap="3xl"
      onSubmit={handleSubmit}
    >
      <Box flexDirection="column" gap="xl">
        <TextField
          id="connection-name"
          label="Connection name"
          value={formValues.name}
          onValueChange={(value) => {
            onUpdateField("name", value);
          }}
          placeholder="My Jazz app"
        />
        <TextField
          id="connection-server-url"
          label="Server URL"
          description={
            error?.field === "serverUrl"
              ? error.description
              : "Sync server that stores your app data."
          }
          value={formValues.serverUrl}
          onBlur={() => {
            markFieldTouched("serverUrl");
          }}
          onInvalid={() => {
            markFieldTouched("serverUrl");
          }}
          onValueChange={(value) => {
            onUpdateField("serverUrl", value);
          }}
          placeholder="https://v2.sync.jazz.tools/"
          required={true}
          invalid={isFieldInvalid("serverUrl") === true || error?.field === "serverUrl"}
        />
        <TextField
          id="connection-app-id"
          label="App ID"
          description={error?.field === "appId" ? error.description : undefined}
          value={formValues.appId}
          onBlur={() => {
            markFieldTouched("appId");
          }}
          onInvalid={() => {
            markFieldTouched("appId");
          }}
          onValueChange={(value) => {
            onUpdateField("appId", value);
          }}
          required={true}
          invalid={isFieldInvalid("appId") === true || error?.field === "appId"}
        />
        <TextField
          id="connection-admin-secret"
          label="Admin secret"
          description={error?.field === "adminSecret" ? error.description : undefined}
          type="password"
          value={formValues.adminSecret}
          onBlur={() => {
            markFieldTouched("adminSecret");
          }}
          onInvalid={() => {
            markFieldTouched("adminSecret");
          }}
          onValueChange={(value) => {
            onUpdateField("adminSecret", value);
          }}
          required={true}
          invalid={isFieldInvalid("adminSecret") === true || error?.field === "adminSecret"}
        />
        <Box display="grid" gridTemplateColumns={{ base: "one", sm: "two" }} gap="m">
          <TextField
            id="connection-env"
            label="Env"
            value={formValues.env}
            onValueChange={(value) => {
              onUpdateField("env", value);
            }}
          />
          <TextField
            id="connection-branch"
            label="Branch"
            value={formValues.branch}
            onValueChange={(value) => {
              onUpdateField("branch", value);
            }}
          />
        </Box>
      </Box>
      {hasError === true ? (
        <Box flexDirection="column" gap="xs" role="status" aria-live="polite">
          <Text color="error" variant="label">
            {error.title}
          </Text>
          {error.field === undefined ? <Text color="error">{error.description}</Text> : null}
        </Box>
      ) : null}
      <Box alignItems="center" justifyContent="end" gap="m">
        <Button type="button" variant="ghost" size="s" onClick={onCancel} disabled={isSubmitting === true}>
          Cancel
        </Button>
        <Button type="submit" size="s" disabled={canSubmit === false} loading={isSubmitting === true}>
          Add connection
        </Button>
      </Box>
    </Box>
  );
}

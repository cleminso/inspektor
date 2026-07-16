import { useState } from "react";

import { Button, Text, TextField } from "@inspector/ds";

import type { AddConnectionFormValues } from "./connectionFormTypes";

type FormSubmitHandler = NonNullable<React.ComponentProps<"form">["onSubmit"]>;

interface AddConnectionFormProps {
  errorMessage: string | null;
  formValues: AddConnectionFormValues;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: FormSubmitHandler;
  onUpdateField: (field: keyof AddConnectionFormValues, value: string) => void;
}

export function AddConnectionForm({
  errorMessage,
  formValues,
  isSubmitting,
  onCancel,
  onSubmit,
  onUpdateField,
}: AddConnectionFormProps): React.ReactElement {
  const hasError = errorMessage !== null;
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
    <form className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
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
          description="Sync server that stores your app data."
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
          invalid={isFieldInvalid("serverUrl") === true}
        />
        <TextField
          id="connection-app-id"
          label="App ID"
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
          invalid={isFieldInvalid("appId") === true}
        />
        <TextField
          id="connection-admin-secret"
          label="Admin secret"
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
          invalid={isFieldInvalid("adminSecret") === true}
        />
        <div className="grid grid-cols-2 gap-4">
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
        </div>
      </div>
      {hasError === true ? (
        <Text color="error" role="status" aria-live="polite">
          {errorMessage}
        </Text>
      ) : null}
      <div className="mt-auto flex items-center justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting === true}>
          Cancel
        </Button>
        <Button type="submit" disabled={canSubmit === false} loading={isSubmitting === true}>
          Add connection
        </Button>
      </div>
    </form>
  );
}

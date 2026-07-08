import { useState } from "react";

import { Button } from "@regarde/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@regarde/ui/field";
import { Input } from "@regarde/ui/input";

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
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof AddConnectionFormValues, boolean>>>({});
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
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="connection-name">Connection name</FieldLabel>
          <Input
            id="connection-name"
            value={formValues.name}
            onChange={(event) => {
              onUpdateField("name", event.currentTarget.value);
            }}
            placeholder="My Jazz app"
          />
        </Field>
        <Field data-invalid={isFieldInvalid("serverUrl") === true}>
          <FieldLabel htmlFor="connection-server-url">Server URL</FieldLabel>
          <Input
            id="connection-server-url"
            value={formValues.serverUrl}
            onBlur={() => {
              markFieldTouched("serverUrl");
            }}
            onInvalid={() => {
              markFieldTouched("serverUrl");
            }}
            onChange={(event) => {
              onUpdateField("serverUrl", event.currentTarget.value);
            }}
            placeholder="https://v2.sync.jazz.tools/"
            required={true}
            aria-invalid={isFieldInvalid("serverUrl") === true}
          />
          <FieldDescription>Sync server that stores your app data.</FieldDescription>
        </Field>
        <Field data-invalid={isFieldInvalid("appId") === true}>
          <FieldLabel htmlFor="connection-app-id">App ID</FieldLabel>
          <Input
            id="connection-app-id"
            value={formValues.appId}
            onBlur={() => {
              markFieldTouched("appId");
            }}
            onInvalid={() => {
              markFieldTouched("appId");
            }}
            onChange={(event) => {
              onUpdateField("appId", event.currentTarget.value);
            }}
            required={true}
            aria-invalid={isFieldInvalid("appId") === true}
          />
        </Field>
        <Field data-invalid={isFieldInvalid("adminSecret") === true}>
          <FieldLabel htmlFor="connection-admin-secret">Admin secret</FieldLabel>
          <Input
            id="connection-admin-secret"
            type="password"
            value={formValues.adminSecret}
            onBlur={() => {
              markFieldTouched("adminSecret");
            }}
            onInvalid={() => {
              markFieldTouched("adminSecret");
            }}
            onChange={(event) => {
              onUpdateField("adminSecret", event.currentTarget.value);
            }}
            required={true}
            aria-invalid={isFieldInvalid("adminSecret") === true}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="connection-env">Env</FieldLabel>
            <Input
              id="connection-env"
              value={formValues.env}
              onChange={(event) => {
                onUpdateField("env", event.currentTarget.value);
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="connection-branch">Branch</FieldLabel>
            <Input
              id="connection-branch"
              value={formValues.branch}
              onChange={(event) => {
                onUpdateField("branch", event.currentTarget.value);
              }}
            />
          </Field>
        </div>
      </FieldGroup>
      <FieldError className="rounded-xs border border-destructive/20 bg-destructive/5 px-3 py-2" aria-live="polite">
        {hasError === true ? errorMessage : null}
      </FieldError>
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

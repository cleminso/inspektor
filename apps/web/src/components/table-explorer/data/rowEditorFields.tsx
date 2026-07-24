import { useMemo, useState } from "react";

import { Link } from "@tanstack/react-router";
import type { ColumnDescriptor } from "jazz-tools";

import {
  Button,
  Checkbox,
  Field,
  Input,
  InputGroup,
  JsonView,
  Select,
  Textarea,
  ToggleGroup,
} from "@inspector/ds";

import { useInspector } from "@/components/providers/inspectorProvider";
import {
  buildMutationFields,
  formatMutationFieldValue,
  getFieldReadOnlyReason,
  parseMutationFieldValue,
  type MutationFormField,
} from "@/lib/table-explorer/mutationParsing";
import { buildRelationTableLink } from "@/lib/table-explorer/relationNavigation";
import type { DetailPaneMode } from "@/types/tableExplorer";
import {
  createColumnJsonViewValue,
  isJsonViewContainer,
} from "@/components/table-explorer/data/jsonViewValue";

// TODO: investigate and when `checkbox NULL` is focus when press `enter` it target the Field.Root
export interface FieldState {
  isNull: boolean;
  text: string;
}

type BooleanFieldValue = "true" | "false" | "null";
type FormSubmitHandler = NonNullable<React.ComponentProps<"form">["onSubmit"]>;

interface UseRowEditorFieldsOptions {
  initialRowValues: Record<string, unknown>;
  mode: DetailPaneMode;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  schemaColumns: ColumnDescriptor[];
}

interface UseRowEditorFieldsResult {
  errors: Record<string, string>;
  fieldStates: Record<string, FieldState>;
  formFields: MutationFormField[];
  isSaving: boolean;
  saveError: string | null;
  setFieldNull: (columnName: string, isNull: boolean) => void;
  setFieldText: (columnName: string, text: string) => void;
  submit: FormSubmitHandler;
}

interface RowEditorFieldsProps {
  errors: Record<string, string>;
  fieldStates: Record<string, FieldState>;
  formFields: MutationFormField[];
  initialRowValues: Record<string, unknown>;
  mode: DetailPaneMode;
  onFieldNullChange: (columnName: string, isNull: boolean) => void;
  onFieldTextChange: (columnName: string, text: string) => void;
}

function getInitialFieldState(
  value: unknown,
  mode: DetailPaneMode,
  column: ColumnDescriptor,
): FieldState {
  if (mode === "insert") {
    return {
      text: formatMutationFieldValue(value),
      isNull: column.nullable,
    };
  }

  return {
    text: formatMutationFieldValue(value),
    isNull: value === null || value === undefined,
  };
}

function getFieldState(
  fieldStates: Record<string, FieldState>,
  rowValues: Record<string, unknown>,
  mode: DetailPaneMode,
  column: ColumnDescriptor,
): FieldState {
  return fieldStates[column.name] ?? getInitialFieldState(rowValues[column.name], mode, column);
}

function createInitialFields(
  rowValues: Record<string, unknown>,
  mode: DetailPaneMode,
  schemaColumns: ColumnDescriptor[],
): Record<string, FieldState> {
  return Object.fromEntries(
    schemaColumns.map((column) => [
      column.name,
      getInitialFieldState(rowValues[column.name], mode, column),
    ]),
  );
}

function formatColumnTypeLabel(column: ColumnDescriptor): string {
  return column.column_type.type.toLowerCase();
}

function formatColumnNameLabel(columnName: string): string {
  if (columnName.length === 0) {
    return columnName;
  }

  return `${columnName.slice(0, 1).toUpperCase()}${columnName.slice(1)}`;
}

function isStructuredColumn(column: ColumnDescriptor): boolean {
  return (
    column.column_type.type === "Json" ||
    column.column_type.type === "Array" ||
    column.column_type.type === "Row"
  );
}

function isBooleanFieldNull(fieldState: FieldState): BooleanFieldValue {
  if (fieldState.isNull === true) {
    return "null";
  }

  return fieldState.text === "true" ? "true" : "false";
}

export function useRowEditorFields({
  initialRowValues,
  mode,
  onSubmit,
  schemaColumns,
}: UseRowEditorFieldsOptions): UseRowEditorFieldsResult {
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>(() =>
    createInitialFields(initialRowValues, mode, schemaColumns),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const formFields = useMemo(() => buildMutationFields(schemaColumns), [schemaColumns]);

  const setFieldText = (columnName: string, text: string) => {
    setFieldStates((currentFields) => ({
      ...currentFields,
      [columnName]: { ...currentFields[columnName], text },
    }));
    setErrors((currentErrors) => ({ ...currentErrors, [columnName]: "" }));
  };

  const setFieldNull = (columnName: string, isNull: boolean) => {
    setFieldStates((currentFields) => ({
      ...currentFields,
      [columnName]: { ...currentFields[columnName], isNull },
    }));
    setErrors((currentErrors) => ({ ...currentErrors, [columnName]: "" }));
  };

  const submit: FormSubmitHandler = async (event) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const updates: Record<string, unknown> = {};

    for (const field of formFields) {
      if (field.readOnlyReason !== null) {
        const initialValue = initialRowValues[field.column.name];
        if (mode === "insert" && initialValue !== undefined) {
          updates[field.column.name] = initialValue;
        }
        continue;
      }

      const fieldState = getFieldState(fieldStates, initialRowValues, mode, field.column);
      if (fieldState.isNull === true) {
        if (field.column.nullable === false) {
          nextErrors[field.column.name] = "This column is not nullable.";
        } else {
          updates[field.column.name] = null;
        }
        continue;
      }

      try {
        updates[field.column.name] = parseMutationFieldValue(
          field.column.column_type,
          fieldState.text,
        );
      } catch (nextError) {
        nextErrors[field.column.name] =
          nextError instanceof Error ? nextError.message : String(nextError);
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      await onSubmit(updates);
    } catch (nextError) {
      setSaveError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    errors,
    fieldStates,
    formFields,
    isSaving,
    saveError,
    setFieldNull,
    setFieldText,
    submit,
  };
}

export function RowEditorFields({
  errors,
  fieldStates,
  formFields,
  initialRowValues,
  mode,
  onFieldNullChange,
  onFieldTextChange,
}: RowEditorFieldsProps): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspector();
  const readOnlyStructuredValues = useMemo(() => {
    const values = new Map<string, ReturnType<typeof createColumnJsonViewValue>>();

    for (const { column, readOnlyReason } of formFields) {
      if (
        isStructuredColumn(column) === true &&
        readOnlyReason !== null &&
        initialRowValues[column.name] !== null &&
        initialRowValues[column.name] !== undefined
      ) {
        values.set(
          column.name,
          createColumnJsonViewValue(initialRowValues[column.name], column.column_type),
        );
      }
    }

    return values;
  }, [formFields, initialRowValues]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 pr-1">
      <Field.Root id="row-editor-field-id">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Field.Label htmlFor="row-editor-id">
              <span>Id</span>
            </Field.Label>
            <span className="text-xs text-muted-foreground">text</span>
          </div>
        </div>
        <Input
          id="row-editor-id"
          value={mode === "insert" ? "auto-generated" : String(initialRowValues.id ?? "")}
          fullWidth
          readOnly
        />
      </Field.Root>

      {formFields.map(({ column, readOnlyReason }) => {
        const fieldId = `row-editor-${column.name}`;
        const fieldLabelId = `${fieldId}-label`;
        const fieldState = getFieldState(fieldStates, initialRowValues, mode, column);
        const fieldError = errors[column.name];
        const isBooleanColumn = column.column_type.type === "Boolean";
        const isBinaryColumn = column.column_type.type === "Bytea";
        const isStructuredColumnType = isStructuredColumn(column);
        const relationTarget =
          column.references !== undefined &&
          fieldState.isNull === false &&
          fieldState.text.trim().length > 0
            ? fieldState.text.trim()
            : null;
        const hasFieldError = fieldError !== undefined && fieldError.length > 0;
        const usesTextInput =
          isBooleanColumn === false &&
          column.column_type.type !== "Enum" &&
          isStructuredColumnType === false &&
          isBinaryColumn === false;
        const readOnlyStructuredValue =
          isStructuredColumnType === true &&
          readOnlyReason !== null &&
          fieldState.isNull === false
            ? (readOnlyStructuredValues.get(column.name) ?? null)
            : null;
        const usesJsonView =
          readOnlyStructuredValue !== null &&
          isJsonViewContainer(readOnlyStructuredValue) === true;

        return (
          <Field.Root
            id={`row-editor-field-${column.name}`}
            key={column.name}
            invalid={hasFieldError}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Field.Label
                  id={fieldLabelId}
                  htmlFor={isBooleanColumn === true || usesJsonView === true ? undefined : fieldId}
                  nativeLabel={isBooleanColumn === false && usesJsonView === false}
                >
                  <span>{formatColumnNameLabel(column.name)}</span>
                </Field.Label>
                <span className="text-xs text-muted-foreground">
                  {formatColumnTypeLabel(column)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {column.nullable === true &&
                readOnlyReason === null &&
                isBooleanColumn === false &&
                usesTextInput === false ? (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      aria-label={`Set ${formatColumnNameLabel(column.name)} to NULL`}
                      checked={fieldState.isNull}
                      onCheckedChange={(nextChecked) => {
                        onFieldNullChange(column.name, nextChecked === true);
                      }}
                    />
                    <span>NULL</span>
                  </label>
                ) : null}
              </div>
            </div>
            {isBooleanColumn === true && readOnlyReason === null ? (
              <ToggleGroup
                value={[isBooleanFieldNull(fieldState)]}
                onValueChange={(values) => {
                  const nextValue = values[0];
                  if (nextValue === "true") {
                    onFieldNullChange(column.name, false);
                    onFieldTextChange(column.name, "true");
                  } else if (nextValue === "false") {
                    onFieldNullChange(column.name, false);
                    onFieldTextChange(column.name, "false");
                  } else if (nextValue === "null") {
                    onFieldNullChange(column.name, true);
                  }
                }}
                width="full"
                itemWidth="equal"
                aria-labelledby={fieldLabelId}
              >
                <ToggleGroup.Item value="true">True</ToggleGroup.Item>
                <ToggleGroup.Item value="false">False</ToggleGroup.Item>
                {column.nullable === true ? (
                  <ToggleGroup.Item value="null">Null</ToggleGroup.Item>
                ) : null}
              </ToggleGroup>
            ) : column.column_type.type === "Enum" && readOnlyReason === null ? (
              <Select.Root
                items={column.column_type.variants}
                value={
                  fieldState.isNull === true || fieldState.text.length === 0
                    ? null
                    : fieldState.text
                }
                onValueChange={(nextValue) => {
                  if (typeof nextValue === "string") {
                    onFieldTextChange(column.name, nextValue);
                  }
                }}
                disabled={fieldState.isNull === true}
              >
                <Select.Trigger id={fieldId} fullWidth>
                  <Select.Value
                    placeholder={fieldState.isNull === true ? "NULL" : "Select value"}
                  />
                  <Select.Icon />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner>
                    <Select.Popup>
                      <Select.List>
                        {column.column_type.variants.map((variant) => (
                          <Select.Item key={variant} value={variant}>
                            <Select.ItemIndicator />
                            <Select.ItemText>{variant}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.List>
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            ) : usesJsonView === true ? (
              <JsonView
                accessibilityLabel={`${formatColumnNameLabel(column.name)} value`}
                data={readOnlyStructuredValue}
              />
            ) : isStructuredColumnType === true || isBinaryColumn === true ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  id={fieldId}
                  height="m"
                  font="mono"
                  value={fieldState.text}
                  readOnly={readOnlyReason !== null || isBinaryColumn === true}
                  disabled={fieldState.isNull === true}
                  onValueChange={(value) => {
                    onFieldTextChange(column.name, value);
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {relationTarget !== null &&
                column.references !== undefined &&
                currentConnectionId !== null &&
                currentBranch !== null &&
                currentSchemaHash !== null ? (
                  <div className="flex justify-end">
                    <Button
                      variant="link"
                      size="s"
                      render={
                        <Link
                          {...buildRelationTableLink({
                            connectionId: currentConnectionId,
                            branch: currentBranch,
                            schemaHash: currentSchemaHash,
                            tableName: column.references,
                            relationId: relationTarget,
                          })}
                        />
                      }
                    >
                      Show
                    </Button>
                  </div>
                ) : null}
                <InputGroup fullWidth>
                  <Input
                    id={fieldId}
                    value={fieldState.isNull === true ? "" : fieldState.text}
                    readOnly={readOnlyReason !== null}
                    disabled={fieldState.isNull === true}
                    onValueChange={(value) => {
                      onFieldTextChange(column.name, value);
                    }}
                  />
                  {column.nullable === true && readOnlyReason === null ? (
                    <InputGroup.Checkbox
                      label={`Set ${formatColumnNameLabel(column.name)} to NULL`}
                      checked={fieldState.isNull}
                      onCheckedChange={(nextChecked) => {
                        onFieldNullChange(column.name, nextChecked === true);
                      }}
                    >
                      NULL
                    </InputGroup.Checkbox>
                  ) : null}
                </InputGroup>
              </div>
            )}

            {getFieldReadOnlyReason(column) === "binary" ? (
              <Field.Description>Read-only: binary field</Field.Description>
            ) : null}
            {hasFieldError === true ? <Field.Error match>{fieldError}</Field.Error> : null}
          </Field.Root>
        );
      })}
    </div>
  );
}

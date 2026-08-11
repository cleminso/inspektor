/**
 * Connects the surface-independent row draft model to the pane form.
 *
 * This module owns form errors, focus, expanded editors, and duplicate-submit protection. Parsing,
 * dirty comparison, live reconciliation, and patch construction remain in the shared mutation
 * modules so an inline editor can reuse them without rendering this pane form.
 */
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import type { ColumnDescriptor } from "jazz-tools";

import { Box, Field, Input, Text } from "@inspector/ds";

import { MutationField } from "@tables/rowEditor/mutationField";
import { buildMutationFields, type MutationFormField } from "@tables/rowEditor/mutation/parsing";
import {
  buildRowMutationSubmission,
  createInsertRowDraft,
  createUpdateRowDraft,
  getMutationFieldInput,
  isRowMutationDraftDirty,
  reconcileRowMutationSource,
  setMutationFieldMode,
  setMutationFieldText,
} from "@tables/rowEditor/mutation/draft";
import type { DetailPaneMode } from "@tables/tableTypes";
import { focusRowEditorField } from "@tables/rowEditor/fieldFocus";

/** Renderable field state derived from a `MutationFieldInput`. */
export interface FieldState {
  isNull: boolean;
  isOmitted: boolean;
  text: string;
}
type FormSubmitHandler = NonNullable<React.ComponentProps<"form">["onSubmit"]>;

interface UseRowEditorFieldsOptions {
  initialRowValues: Record<string, unknown>;
  mode: DetailPaneMode;
  onDirtyChange?: (isDirty: boolean) => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  schemaColumns: ColumnDescriptor[];
}

interface UseRowEditorFieldsResult {
  errors: Record<string, string>;
  expandedColumnName: string | null;
  fieldStates: Record<string, FieldState>;
  formFields: MutationFormField[];
  isSaving: boolean;
  isDirty: boolean;
  saveError: string | null;
  setFieldExpanded: (columnName: string, expanded: boolean) => void;
  setFieldNull: (columnName: string, isNull: boolean) => void;
  setFieldOmitted: (columnName: string, isOmitted: boolean) => void;
  setFieldText: (columnName: string, text: string) => void;
  submit: FormSubmitHandler;
}

interface RowEditorFieldsProps {
  errors: Record<string, string>;
  expandedColumnName: string | null;
  fieldStates: Record<string, FieldState>;
  formFields: MutationFormField[];
  initialRowValues: Record<string, unknown>;
  mode: DetailPaneMode;
  onFieldExpandedChange: (columnName: string, expanded: boolean) => void;
  onFieldNullChange: (columnName: string, isNull: boolean) => void;
  onFieldOmittedChange: (columnName: string, isOmitted: boolean) => void;
  onFieldTextChange: (columnName: string, text: string) => void;
}

function isStructuredColumn(column: ColumnDescriptor): boolean {
  return (
    column.column_type.type === "Json" ||
    column.column_type.type === "Array" ||
    column.column_type.type === "Row"
  );
}

/**
 * Owns one pane form draft from initialization through submission.
 *
 * For edit mode, typing in `name` creates a sparse `name` overlay while every untouched field
 * continues reading from the live row. For insert mode, the hook starts with the complete baseline
 * created by `createInsertRowDraft`. Both modes report one semantic dirty state to the transition
 * guard and send only validated values to `onSubmit`.
 */
export function useRowEditorFields({
  initialRowValues,
  mode,
  onDirtyChange,
  onSubmit,
  schemaColumns,
}: UseRowEditorFieldsOptions): UseRowEditorFieldsResult {
  const [draft, setDraft] = useState(() =>
    mode === "insert"
      ? createInsertRowDraft(initialRowValues, schemaColumns)
      : createUpdateRowDraft(initialRowValues),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedColumnName, setExpandedColumnName] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const formFields = useMemo(() => buildMutationFields(schemaColumns), [schemaColumns]);
  const deferredDraft = useDeferredValue(draft);
  const deferredIsDirty = useMemo(
    () => isRowMutationDraftDirty(deferredDraft, schemaColumns),
    [deferredDraft, schemaColumns],
  );
  const urgentIsDirty =
    draft.kind === "update"
      ? Object.keys(draft.fieldInputs).length > 0
      : isRowMutationDraftDirty(draft, schemaColumns);
  const isDirty = draft === deferredDraft ? deferredIsDirty : urgentIsDirty;
  const fieldStates = useMemo<Record<string, FieldState>>(
    () =>
      Object.fromEntries(
        schemaColumns.map((column) => {
          const input = getMutationFieldInput(draft, column);
          return [
            column.name,
            {
              isNull: input.mode === "null",
              isOmitted: input.mode === "omitted",
              text: input.text,
            },
          ];
        }),
      ),
    [draft, schemaColumns],
  );

  useEffect(() => {
    // Reconcile live rows and schema changes without resetting dirty field overlays.
    setDraft((currentDraft) =>
      reconcileRowMutationSource(currentDraft, initialRowValues, schemaColumns),
    );
  }, [initialRowValues, schemaColumns]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(
    () => () => {
      // The mounted form owns the dirty report; release it when this draft leaves the tree.
      onDirtyChange?.(false);
    },
    [onDirtyChange],
  );

  const setFieldText = (columnName: string, text: string) => {
    const column = schemaColumns.find((candidate) => candidate.name === columnName);
    if (column === undefined) {
      return;
    }
    setDraft((currentDraft) => {
      // Disabled editors can emit delayed callbacks after NULL or DEFAULT becomes active.
      if (getMutationFieldInput(currentDraft, column).mode !== "value") {
        return currentDraft;
      }
      return setMutationFieldText(currentDraft, column, text);
    });
    setErrors((currentErrors) => ({ ...currentErrors, [columnName]: "" }));
  };

  const setFieldNull = (columnName: string, isNull: boolean) => {
    setDraft((currentDraft) => {
      const column = schemaColumns.find((candidate) => candidate.name === columnName);
      if (column === undefined) {
        return currentDraft;
      }
      const currentInput = getMutationFieldInput(currentDraft, column);
      const shouldSeedStructuredValue =
        isNull === false && currentInput.text.length === 0 && isStructuredColumn(column) === true;
      if (shouldSeedStructuredValue === true) {
        // Leaving NULL starts structured editors with valid JSON instead of an invalid blank value.
        return setMutationFieldText(
          currentDraft,
          column,
          column.column_type.type === "Array" ? "[]" : "{}",
        );
      }
      return setMutationFieldMode(currentDraft, column, isNull === true ? "null" : "value");
    });
    if (isNull === true) {
      setExpandedColumnName((currentColumnName) =>
        currentColumnName === columnName ? null : currentColumnName,
      );
    }
    setErrors((currentErrors) => ({ ...currentErrors, [columnName]: "" }));
  };

  const setFieldOmitted = (columnName: string, isOmitted: boolean) => {
    const column = schemaColumns.find((candidate) => candidate.name === columnName);
    if (column === undefined) {
      return;
    }
    setDraft((currentDraft) =>
      setMutationFieldMode(currentDraft, column, isOmitted === true ? "omitted" : "value"),
    );
    setErrors((currentErrors) => ({ ...currentErrors, [columnName]: "" }));
  };

  const setFieldExpanded = (columnName: string, expanded: boolean) => {
    setExpandedColumnName((currentColumnName) =>
      expanded === true ? columnName : currentColumnName === columnName ? null : currentColumnName,
    );
  };

  const submit: FormSubmitHandler = async (event) => {
    event.preventDefault();
    // React state cannot reject two submit events dispatched before the next render.
    if (isSavingRef.current === true) {
      return;
    }
    const submission = buildRowMutationSubmission(draft, schemaColumns);
    const nextErrors = submission.errors;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // Collapse expanded editors so the first invalid field can be revealed and focused.
      setExpandedColumnName(null);
      const firstInvalidField = formFields.find(
        (field) => nextErrors[field.column.name] !== undefined,
      );
      if (firstInvalidField !== undefined) {
        requestAnimationFrame(() => {
          focusRowEditorField(firstInvalidField.column.name);
        });
      }
      return;
    }
    if (mode === "edit" && Object.keys(submission.values).length === 0) {
      return;
    }

    try {
      isSavingRef.current = true;
      setIsSaving(true);
      setSaveError(null);
      await onSubmit(submission.values);
    } catch (nextError) {
      setSaveError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  return {
    errors,
    expandedColumnName,
    fieldStates,
    formFields,
    isDirty,
    isSaving,
    saveError,
    setFieldExpanded,
    setFieldNull,
    setFieldOmitted,
    setFieldText,
    submit,
  };
}

/** Renders schema-derived fields from state and actions owned by `useRowEditorFields`. */
export function RowEditorFields({
  errors,
  expandedColumnName,
  fieldStates,
  formFields,
  initialRowValues,
  mode,
  onFieldExpandedChange,
  onFieldNullChange,
  onFieldOmittedChange,
  onFieldTextChange,
}: RowEditorFieldsProps): React.ReactElement {
  return (
    <Box flexDirection="column" flexGrow={1} gap="l" minHeight={0} pr="xs">
      <Field.Root hidden={expandedColumnName !== null} id="row-editor-field-id">
        <Box
          alignItems="end"
          data-slot="row-id-field-header"
          gap="m"
          justifyContent="between"
          width="full"
        >
          <Box alignItems="center" minWidth={0}>
            <Field.Label htmlFor="row-editor-id">
              <Text as="span">ID</Text>
            </Field.Label>
          </Box>
          <Text as="span" color="muted" variant="caption">
            UUID
          </Text>
        </Box>
        <Input
          id="row-editor-id"
          font="mono"
          value={mode === "insert" ? "auto-generated" : String(initialRowValues.id ?? "")}
          fullWidth
          readOnly
        />
      </Field.Root>

      {formFields.map(({ column, readOnlyReason }) => {
        const fieldState = fieldStates[column.name];
        if (fieldState === undefined) {
          return null;
        }
        const isExpanded = expandedColumnName === column.name;

        return (
          <MutationField
            column={column}
            error={errors[column.name]}
            expanded={isExpanded}
            fieldState={fieldState}
            hidden={expandedColumnName !== null && isExpanded === false}
            initialValue={initialRowValues[column.name]}
            onExpandedChange={(expanded) => onFieldExpandedChange(column.name, expanded)}
            onNullChange={(isNull) => onFieldNullChange(column.name, isNull)}
            onOmittedChange={(isOmitted) => onFieldOmittedChange(column.name, isOmitted)}
            onTextChange={(text) => onFieldTextChange(column.name, text)}
            canOmit={mode === "insert" && column.default !== undefined && readOnlyReason === null}
            readOnlyReason={readOnlyReason}
            key={column.name}
          />
        );
      })}
    </Box>
  );
}

import { useMemo, type RefCallback } from "react";

import { Link } from "@tanstack/react-router";
import type { ColumnDescriptor } from "jazz-tools";

import {
  BinaryDetails,
  Box,
  Checkbox,
  CodeEditor,
  DatePicker,
  Field,
  Input,
  InputGroup,
  JsonView,
  Select,
  Text,
  TextLink,
  TimestampValue,
  ToggleGroup,
  type CodeEditorLayout,
} from "@inspector/ds";

import { useInspectorSessionState } from "@app/providers/inspectorProvider";
import {
  formatColumnNameLabel,
  formatColumnTypeLabel,
  getBooleanFieldValue,
  isStructuredColumn,
  parseTimestampValue,
  safelySerializeStructuredValue,
} from "@tables/rowEditor/values/fieldPresentation";
import { focusRowEditorField } from "@tables/rowEditor/fieldFocus";
import { copyBinaryValue, downloadBinaryValue } from "@tables/rowEditor/values/binary";
import type { MutationFieldReadOnlyReason } from "@tables/rowEditor/mutation/parsing";
import { buildRelationTableLink } from "@tables/routing/buildRelationTableLink";
import { formatColumnDefault } from "@tables/rowEditor/mutation/draft";

interface MutationFieldProps {
  canOmit: boolean;
  column: ColumnDescriptor;
  controlRef?: RefCallback<HTMLElement>;
  error: string | undefined;
  expanded: boolean;
  fieldState: { isNull: boolean; isOmitted: boolean; text: string };
  focusOnMount?: boolean;
  hidden: boolean;
  idPrefix?: string;
  initialValue: unknown;
  onExpandedChange: (expanded: boolean) => void;
  onNullChange: (isNull: boolean) => void;
  onOmittedChange: (isOmitted: boolean) => void;
  onTextChange: (text: string) => void;
  readOnlyReason: MutationFieldReadOnlyReason;
  structuredEditorLayout?: CodeEditorLayout;
}

interface NullInputGroupCheckboxProps {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}

type StructuredValueMode = "default" | "null" | "value";

interface StructuredValueModeControlProps {
  label: string;
  mode: StructuredValueMode;
  modes: readonly StructuredValueMode[];
  onModeChange: (mode: StructuredValueMode) => void;
}

function StructuredValueModeControl({
  label,
  mode,
  modes,
  onModeChange,
}: StructuredValueModeControlProps): React.ReactElement {
  return (
    <ToggleGroup<StructuredValueMode>
      aria-label={`${label} value mode`}
      size="s"
      value={[mode]}
      onValueChange={(nextModes) => {
        const nextMode = nextModes[0];
        if (nextMode !== undefined && nextMode !== mode) {
          onModeChange(nextMode);
        }
      }}
    >
      <ToggleGroup.Item data-value-mode-control={mode === "value" ? "" : undefined} value="value">
        Value
      </ToggleGroup.Item>
      {modes.includes("default") ? (
        <ToggleGroup.Item
          data-value-mode-control={mode === "default" ? "" : undefined}
          value="default"
        >
          Default
        </ToggleGroup.Item>
      ) : null}
      {modes.includes("null") ? (
        <ToggleGroup.Item data-value-mode-control={mode === "null" ? "" : undefined} value="null">
          NULL
        </ToggleGroup.Item>
      ) : null}
    </ToggleGroup>
  );
}

interface StructuredValuePresentationProps {
  accessibilityLabel: string;
  value: string;
}

function StructuredValuePresentation({
  accessibilityLabel,
  value,
}: StructuredValuePresentationProps): React.ReactElement {
  return (
    <Box
      aria-label={accessibilityLabel}
      backgroundColor="surface-default"
      borderColor="default"
      borderRadius="xs"
      borderStyle="solid"
      borderWidth={1}
      data-slot="structured-value-presentation"
      flexDirection="column"
      overflow="hidden"
      role="group"
      width="full"
    >
      <Box padding="m">
        <Text as="span" monospace>
          {value}
        </Text>
      </Box>
    </Box>
  );
}

function NullInputGroupCheckbox({
  checked,
  label,
  onCheckedChange,
}: NullInputGroupCheckboxProps): React.ReactElement {
  return (
    <InputGroup.Checkbox
      label={`Set ${label} to NULL`}
      checked={checked}
      tooltip="Save this field as NULL, even when the schema defines a default. Turn off NULL to enter a value."
      onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)}
    >
      NULL
    </InputGroup.Checkbox>
  );
}

export function MutationField({
  canOmit,
  column,
  controlRef,
  error,
  expanded,
  fieldState,
  focusOnMount = false,
  hidden,
  idPrefix = "row-editor",
  initialValue,
  onExpandedChange,
  onNullChange,
  onOmittedChange,
  onTextChange,
  readOnlyReason,
  structuredEditorLayout = "fill",
}: MutationFieldProps): React.ReactElement {
  const { currentConnectionId } = useInspectorSessionState();
  const label = formatColumnNameLabel(column.name);
  const fieldId = `${idPrefix}-${column.name}`;
  const fieldLabelId = `${fieldId}-label`;
  const isBooleanColumn = column.column_type.type === "Boolean";
  const isBinaryColumn = column.column_type.type === "Bytea";
  const isEnumColumn = column.column_type.type === "Enum";
  const isStructuredColumnType = isStructuredColumn(column);
  const isTimestampColumn = column.column_type.type === "Timestamp";
  const isReadOnly = readOnlyReason !== null;
  const isEditableStructuredColumn = isStructuredColumnType === true && isReadOnly === false;
  const hasFieldError = error !== undefined && error.length > 0;
  const structuredPresentation = useMemo(
    () =>
      isStructuredColumnType === true && fieldState.isNull === false && readOnlyReason !== null
        ? safelySerializeStructuredValue(initialValue, column)
        : null,
    [column, fieldState.isNull, initialValue, isStructuredColumnType, readOnlyReason],
  );
  const usesJsonView = structuredPresentation?.fallback != null;
  const usesNonNativeControl =
    fieldState.isOmitted === false &&
    (isBooleanColumn === true ||
      isBinaryColumn === true ||
      isEnumColumn === true ||
      isStructuredColumnType === true ||
      usesJsonView);
  const relationTarget =
    column.references !== undefined &&
    fieldState.isNull === false &&
    fieldState.text.trim().length > 0
      ? fieldState.text.trim()
      : null;
  const timestampValue =
    isTimestampColumn === true ? parseTimestampValue(fieldState.text) : undefined;
  const timestampTextIsEmpty = fieldState.text.trim().length === 0;
  const formattedDefault = column.default === undefined ? "" : formatColumnDefault(column);
  const defaultValue =
    column.default?.type === "Null"
      ? "NULL"
      : formattedDefault.length === 0
        ? '""'
        : formattedDefault;
  const defaultDescriptionValue =
    column.default?.type === "Null" || formattedDefault.length === 0
      ? defaultValue
      : column.column_type.type === "Text" ||
          column.column_type.type === "Uuid" ||
          column.column_type.type === "Enum"
      ? JSON.stringify(defaultValue)
       : defaultValue;
  const structuredValueMode: StructuredValueMode =
    fieldState.isOmitted === true ? "default" : fieldState.isNull === true ? "null" : "value";
  const structuredValueModes: readonly StructuredValueMode[] = [
    "value",
    ...(canOmit === true ? (["default"] as const) : []),
    ...(column.nullable === true ? (["null"] as const) : []),
  ];
  const defaultCheckbox =
    canOmit === true && isStructuredColumnType === false ? (
      <InputGroup.Checkbox
        label={`Use default for ${label}`}
        checked={fieldState.isOmitted}
        tooltip={`Create this row with the default value: ${defaultDescriptionValue}. Turn off DEFAULT to enter a different value.`}
        onCheckedChange={(nextChecked) => onOmittedChange(nextChecked === true)}
      >
        DEFAULT
      </InputGroup.Checkbox>
    ) : null;
  const defaultRestoreControl =
    canOmit === true && fieldState.isOmitted === false && isStructuredColumnType === false ? (
      <InputGroup fullWidth>
        <Input aria-label={`${label} schema default`} font="mono" readOnly value={defaultValue} />
        {defaultCheckbox}
      </InputGroup>
    ) : null;

  return (
    <Field.Root
      data-value-mode={
        fieldState.isOmitted === true
          ? "omitted"
          : isEditableStructuredColumn === true
          ? fieldState.isNull === true
            ? "null"
            : "value"
          : undefined
      }
      hidden={hidden}
      id={`${idPrefix}-field-${column.name}`}
      invalid={hasFieldError}
      render={
        isEditableStructuredColumn === true ? (
          <Box
            flexDirection="column"
            flexGrow={expanded === true ? 1 : 0}
            gap="xs"
            minHeight={expanded === true ? 0 : undefined}
            minWidth={0}
            width="full"
          />
        ) : undefined
      }
    >
      <Box
        alignItems="end"
        data-slot="mutation-field-header"
        justifyContent="between"
        gap="m"
        width="full"
      >
        <Box alignItems="center" minWidth={0}>
          <Field.Label
            id={fieldLabelId}
            htmlFor={usesNonNativeControl === true ? undefined : fieldId}
            nativeLabel={usesNonNativeControl === false}
            render={usesNonNativeControl === true ? <Text as="span" /> : undefined}
            onClickCapture={
              isEditableStructuredColumn === true
                ? (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    focusRowEditorField(column.name);
                  }
                : undefined
            }
          >
            {usesNonNativeControl === true ? label : <Text as="span">{label}</Text>}
          </Field.Label>
        </Box>
        {isEditableStructuredColumn === true &&
        (canOmit === true || column.nullable === true) ? (
          <StructuredValueModeControl
            label={label}
            mode={structuredValueMode}
            modes={structuredValueModes}
            onModeChange={(nextMode) => {
              if (nextMode === "default") {
                onOmittedChange(true);
              } else if (nextMode === "null") {
                onNullChange(true);
              } else if (fieldState.isOmitted === true) {
                onOmittedChange(false);
              } else {
                onNullChange(false);
              }
            }}
          />
        ) : null}
        {fieldState.isOmitted === false &&
          column.nullable === true &&
          readOnlyReason === null &&
          isBooleanColumn === false &&
          (isEnumColumn === true || isBinaryColumn === true) ? (
          <Checkbox.Label>
            <Checkbox
              data-value-mode-control={isStructuredColumnType === true ? "" : undefined}
              aria-label={`Set ${label} to NULL`}
              checked={fieldState.isNull}
              onCheckedChange={(nextChecked) => onNullChange(nextChecked === true)}
            />
            <Text as="span">NULL</Text>
          </Checkbox.Label>
          ) : null}
        {isEditableStructuredColumn === false ? (
          <Text as="span" color="muted" variant="caption">
            {formatColumnTypeLabel(column)}
          </Text>
        ) : null}
      </Box>

      {fieldState.isOmitted === true ? (
        isStructuredColumnType === true ? (
          <StructuredValuePresentation
            accessibilityLabel={`${label} value: default`}
            value={defaultValue}
          />
        ) : (
          <InputGroup fullWidth>
            <Input id={fieldId} aria-label={label} disabled font="mono" value={defaultValue} />
            {defaultCheckbox}
          </InputGroup>
        )
      ) : isBooleanColumn === true ? (
        <ToggleGroup
          value={[getBooleanFieldValue(fieldState)]}
          onValueChange={(values) => {
            const nextValue = values[0];
            if (nextValue === "true" || nextValue === "false") {
              onNullChange(false);
              onTextChange(nextValue);
            } else if (nextValue === "null") {
              onNullChange(true);
            } else if (nextValue === "default") {
              onOmittedChange(true);
            }
          }}
          width="full"
          itemWidth="equal"
          aria-labelledby={fieldLabelId}
        >
          <ToggleGroup.Item ref={controlRef} value="true">True</ToggleGroup.Item>
          <ToggleGroup.Item value="false">False</ToggleGroup.Item>
          {column.nullable === true ? (
            <ToggleGroup.Item value="null">Null</ToggleGroup.Item>
          ) : null}
          {canOmit === true ? (
            <ToggleGroup.Item value="default">Default</ToggleGroup.Item>
          ) : null}
        </ToggleGroup>
      ) : isEnumColumn === true && column.column_type.type === "Enum" ? (
        <Box flexDirection="column" gap="s">
          <Select.Root
            disabled={fieldState.isNull === true}
            items={column.column_type.variants.map((variant) => ({ label: variant, value: variant }))}
            value={fieldState.text.length === 0 ? null : fieldState.text}
            onValueChange={(nextValue) => {
              if (typeof nextValue === "string") {
                onTextChange(nextValue);
              }
            }}
          >
            <Select.Trigger ref={controlRef} id={fieldId} placeholder="Select value…" width="full" />
            <Select.Content>
              {column.column_type.variants.map((variant) => (
                <Select.Item key={variant} value={variant}>
                  {variant}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          {defaultRestoreControl}
        </Box>
      ) : usesJsonView === true && structuredPresentation?.fallback != null ? (
        <JsonView accessibilityLabel={`${label} value`} data={structuredPresentation.fallback} />
      ) : isStructuredColumnType === true ? (
        <>
          {fieldState.isNull === true ? (
            <StructuredValuePresentation
              accessibilityLabel={`${label} value: NULL`}
              value="NULL"
            />
          ) : (
            <Box
              flexDirection="column"
              flexGrow={expanded === true ? 1 : 0}
              minHeight={expanded === true ? 0 : undefined}
              overflow={expanded === true ? "hidden" : undefined}
            >
              <CodeEditor
                id={fieldId}
                labelledBy={fieldLabelId}
                describedBy={hasFieldError === true ? `${fieldId}-error` : undefined}
                expanded={expanded}
                focusOnMount={focusOnMount}
                invalid={hasFieldError}
                layout={expanded === true ? structuredEditorLayout : "intrinsic"}
                readOnly={isReadOnly}
                onExpandedChange={onExpandedChange}
                value={structuredPresentation?.source ?? fieldState.text}
                onValueChange={onTextChange}
              />
            </Box>
          )}
          {defaultRestoreControl}
        </>
      ) : isBinaryColumn === true && initialValue instanceof Uint8Array ? (
        <BinaryDetails
          byteLength={initialValue.byteLength}
          onCopy={(format) => copyBinaryValue(initialValue, format)}
          onDownload={() => downloadBinaryValue(initialValue, `${column.name}.bin`)}
        />
      ) : isTimestampColumn === true &&
        (timestampValue !== undefined || timestampTextIsEmpty === true) ? (
        <InputGroup fullWidth>
          {fieldState.isNull === true ? (
            <Input id={fieldId} aria-label={label} disabled font="mono" value="" />
          ) : (
            <DatePicker
              disabled={isReadOnly === true}
              value={timestampValue}
              onApply={(nextValue) => onTextChange(nextValue.toISOString())}
            >
              <DatePicker.Trigger ref={controlRef} id={fieldId} label={label}>
                {timestampValue === undefined ? "Select Date" : <TimestampValue value={timestampValue} />}
              </DatePicker.Trigger>
              <DatePicker.Content />
            </DatePicker>
          )}
          {column.nullable === true && readOnlyReason === null ? (
            <NullInputGroupCheckbox
              label={label}
              checked={fieldState.isNull}
              onCheckedChange={onNullChange}
            />
          ) : null}
          {defaultCheckbox}
        </InputGroup>
      ) : (
        <Box flexDirection="column" gap="s">
          <InputGroup fullWidth>
            <Input
              ref={controlRef}
              id={fieldId}
              font="mono"
              value={fieldState.text}
              disabled={fieldState.isNull === true}
              readOnly={isReadOnly === true || isBinaryColumn === true}
              onValueChange={onTextChange}
            />
            {column.nullable === true && readOnlyReason === null ? (
              <NullInputGroupCheckbox
                label={label}
                checked={fieldState.isNull}
                onCheckedChange={onNullChange}
              />
            ) : null}
            {defaultCheckbox}
            {relationTarget !== null &&
            column.references !== undefined &&
            currentConnectionId !== null ? (
              <InputGroup.Suffix>
                <TextLink
                  render={
                    <Link
                      {...buildRelationTableLink({
                        connectionId: currentConnectionId,
                        tableName: column.references,
                      })}
                    />
                  }
                >
                  Open target
                </TextLink>
              </InputGroup.Suffix>
            ) : null}
          </InputGroup>
        </Box>
      )}

      {readOnlyReason === "binary" ? (
        <Field.Description>Read-only: binary field</Field.Description>
      ) : null}
      {column.default !== undefined && fieldState.isOmitted === false ? (
        <Field.Description>
          {canOmit === true
            ? fieldState.isNull === true
              ? `NULL overrides the schema default: ${defaultDescriptionValue}.`
              : `Entered values override the schema default: ${defaultDescriptionValue}.`
            : `Schema default for new rows: ${defaultDescriptionValue}. Editing this field changes this row only.`}
        </Field.Description>
      ) : null}
      {hasFieldError === true ? (
        <Field.Error id={`${fieldId}-error`} match>
          {error}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}

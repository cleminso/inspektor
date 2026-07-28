import { useMemo } from "react";

import { Link } from "@tanstack/react-router";
import type { ColumnDescriptor } from "jazz-tools";

import {
  Box,
  Button,
  Checkbox,
  CodeEditor,
  Field,
  Input,
  InputGroup,
  JsonView,
  Select,
  Text,
  ToggleGroup,
} from "@inspector/ds";

import { useInspector } from "@/components/providers/inspectorProvider";
import {
  formatColumnNameLabel,
  formatColumnTypeLabel,
  formatTimestampInputValue,
  getBooleanFieldValue,
  isStructuredColumn,
  parseTimestampInputValue,
  safelySerializeStructuredValue,
} from "@/components/table-explorer/data/fieldPresentation";
import { focusRowEditorField } from "@/components/table-explorer/data/rowEditorFocus";
import type { MutationFieldReadOnlyReason } from "@/lib/table-explorer/mutationParsing";
import { buildRelationTableLink } from "@/lib/table-explorer/relationNavigation";

interface MutationFieldProps {
  canOmit: boolean;
  column: ColumnDescriptor;
  error: string | undefined;
  expanded: boolean;
  fieldState: { isNull: boolean; isOmitted: boolean; text: string };
  hidden: boolean;
  initialValue: unknown;
  onExpandedChange: (expanded: boolean) => void;
  onNullChange: (isNull: boolean) => void;
  onOmittedChange: (isOmitted: boolean) => void;
  onTextChange: (text: string) => void;
  readOnlyReason: MutationFieldReadOnlyReason;
}

export function MutationField({
  canOmit,
  column,
  error,
  expanded,
  fieldState,
  hidden,
  initialValue,
  onExpandedChange,
  onNullChange,
  onOmittedChange,
  onTextChange,
  readOnlyReason,
}: MutationFieldProps): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspector();
  const label = formatColumnNameLabel(column.name);
  const fieldId = `row-editor-${column.name}`;
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
      isEnumColumn === true ||
      isStructuredColumnType === true ||
      usesJsonView);
  const relationTarget =
    column.references !== undefined &&
    fieldState.isNull === false &&
    fieldState.text.trim().length > 0
      ? fieldState.text.trim()
      : null;
  const timestampInputValue =
    isTimestampColumn === true ? formatTimestampInputValue(fieldState.text) : null;

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
      id={`row-editor-field-${column.name}`}
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
      <Box alignItems="start" justifyContent="between" gap="m">
        <Box alignItems="center" gap="s" minWidth={0}>
          <Field.Label
            id={fieldLabelId}
            htmlFor={usesNonNativeControl === true ? undefined : fieldId}
            nativeLabel={usesNonNativeControl === false}
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
            <Text as="span">{label}</Text>
          </Field.Label>
          {isEditableStructuredColumn === false ? (
            <Text as="span" color="muted" variant="caption">
              {formatColumnTypeLabel(column)}
            </Text>
          ) : null}
        </Box>
        <Box alignItems="center" gap="m">
          {canOmit === true ? (
            <Checkbox.Label>
              <Checkbox
                aria-label={`Use default for ${label}`}
                checked={fieldState.isOmitted}
                onCheckedChange={(nextChecked) => onOmittedChange(nextChecked === true)}
              />
              <Text as="span">DEFAULT</Text>
            </Checkbox.Label>
          ) : null}
          {fieldState.isOmitted === false &&
          column.nullable === true &&
          readOnlyReason === null &&
          isBooleanColumn === false &&
          (isStructuredColumnType === true || isEnumColumn === true || isBinaryColumn === true) ? (
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
        </Box>
      </Box>

      {fieldState.isOmitted === true ? (
        <Input id={fieldId} aria-label={label} readOnly fullWidth value="DEFAULT" />
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
            }
          }}
          width="full"
          itemWidth="equal"
          aria-labelledby={fieldLabelId}
        >
          <ToggleGroup.Item value="true">True</ToggleGroup.Item>
          <ToggleGroup.Item value="false">False</ToggleGroup.Item>
          {column.nullable === true ? <ToggleGroup.Item value="null">Null</ToggleGroup.Item> : null}
        </ToggleGroup>
      ) : isEnumColumn === true && column.column_type.type === "Enum" ? (
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
          <Select.Trigger id={fieldId} fullWidth>
            <Select.Value placeholder="Select value" />
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
      ) : usesJsonView === true && structuredPresentation?.fallback != null ? (
        <JsonView accessibilityLabel={`${label} value`} data={structuredPresentation.fallback} />
      ) : isStructuredColumnType === true ? (
        <>
          <Box
            flexDirection="column"
            flexGrow={expanded === true ? 1 : 0}
            hidden={fieldState.isNull === true}
            minHeight={expanded === true ? 0 : undefined}
            overflow={expanded === true ? "hidden" : undefined}
          >
            <CodeEditor
              id={fieldId}
              labelledBy={fieldLabelId}
              describedBy={hasFieldError === true ? `${fieldId}-error` : undefined}
              disabled={fieldState.isNull === true}
              expanded={expanded}
              invalid={hasFieldError}
              layout={expanded === true ? "fill" : "intrinsic"}
              readOnly={isReadOnly}
              toolbarLabel={formatColumnTypeLabel(column)?.toUpperCase()}
              onExpandedChange={onExpandedChange}
              value={structuredPresentation?.source ?? fieldState.text}
              onValueChange={onTextChange}
            />
          </Box>
          {fieldState.isNull === true ? (
            <Input data-null-value aria-label={`${label} value`} readOnly fullWidth value="NULL" />
          ) : null}
        </>
      ) : isTimestampColumn === true && timestampInputValue !== null ? (
        <InputGroup fullWidth>
          <Input
            id={fieldId}
            type="datetime-local"
            step="1"
            value={timestampInputValue}
            disabled={fieldState.isNull === true}
            readOnly={isReadOnly}
            onValueChange={(nextValue) => onTextChange(parseTimestampInputValue(nextValue))}
          />
          {column.nullable === true && readOnlyReason === null ? (
            <InputGroup.Checkbox
              label={`Set ${label} to NULL`}
              checked={fieldState.isNull}
              onCheckedChange={(nextChecked) => onNullChange(nextChecked === true)}
            >
              NULL
            </InputGroup.Checkbox>
          ) : null}
        </InputGroup>
      ) : (
        <Box flexDirection="column" gap="s">
          <InputGroup fullWidth>
            <Input
              id={fieldId}
              value={fieldState.text}
              disabled={fieldState.isNull === true}
              readOnly={isReadOnly || isBinaryColumn === true}
              onValueChange={onTextChange}
            />
            {column.nullable === true && readOnlyReason === null ? (
              <InputGroup.Checkbox
                label={`Set ${label} to NULL`}
                checked={fieldState.isNull}
                onCheckedChange={(nextChecked) => onNullChange(nextChecked === true)}
              >
                NULL
              </InputGroup.Checkbox>
            ) : null}
          </InputGroup>
          {relationTarget !== null &&
          column.references !== undefined &&
          currentConnectionId !== null &&
          currentBranch !== null &&
          currentSchemaHash !== null ? (
            <Box justifyContent="end">
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
            </Box>
          ) : null}
        </Box>
      )}

      {readOnlyReason === "binary" ? (
        <Field.Description>Read-only: binary field</Field.Description>
      ) : null}
      {hasFieldError === true ? (
        <Field.Error id={`${fieldId}-error`} match>
          {error}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}

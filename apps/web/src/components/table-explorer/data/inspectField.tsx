import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { Link } from "@tanstack/react-router";
import type { ColumnDescriptor } from "jazz-tools";

import {
  BinaryDetails,
  Box,
  CodeEditor,
  Field,
  Input,
  JsonView,
  RelationDetails,
  Select,
  Text,
  TimestampDetails,
  ToggleGroup,
} from "@inspector/ds";

import { useInspector } from "@/components/providers/inspectorProvider";
import {
  formatColumnNameLabel,
  formatColumnTypeLabel,
  getBooleanFieldValue,
  isStructuredColumn,
  safelyFormatValue,
  safelySerializeStructuredValue,
} from "@/components/table-explorer/data/fieldPresentation";
import { copyBinaryValue, downloadBinaryValue } from "@/lib/table-explorer/binaryValue";
import { buildRelationTableLink } from "@/lib/table-explorer/relationNavigation";
import {
  classifySchemaValue,
  type SchemaValuePresentation,
} from "@/lib/table-explorer/schemaValuePresentation";
import { useRelationRow } from "@/hooks/useRelationRow";

type InspectFieldProps =
  | { column: ColumnDescriptor; name?: never; targetIdentity: string; value: unknown }
  | { column: null; name: string; targetIdentity: string; value: unknown };

type RelationPresentation = Extract<SchemaValuePresentation, { kind: "relation" }>;

function InspectRelationValue({
  presentation,
}: {
  presentation: RelationPresentation;
}): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspector();
  const resolution = useRelationRow(presentation.relationTable, presentation.relationId);
  const navigation =
    currentConnectionId === null || currentBranch === null || currentSchemaHash === null
      ? undefined
      : {
          render: (
            <Link
              {...buildRelationTableLink({
                connectionId: currentConnectionId,
                branch: currentBranch,
                schemaHash: currentSchemaHash,
                tableName: presentation.relationTable,
                relationId: presentation.relationId,
              })}
            />
          ),
        };

  return (
    <RelationDetails
      id={presentation.relationId}
      navigation={navigation}
      state={resolution}
      target={presentation.relationTable}
    />
  );
}

function isEnabledFocusTarget(element: HTMLElement): boolean {
  return (
    element.tabIndex >= 0 &&
    element.matches(":disabled") === false &&
    element.getAttribute("aria-disabled") !== "true" &&
    element.closest("[aria-disabled='true']") === null &&
    element.hidden === false
  );
}

function focusField(root: HTMLElement): void {
  const control = Array.from(
    root.querySelectorAll<HTMLElement>(
      "input, textarea, [role='textbox'], [role='radio'], button, [tabindex]:not([tabindex='-1'])",
    ),
  ).find(isEnabledFocusTarget);
  (control ?? root).focus();
}

export function InspectField({
  column,
  name,
  targetIdentity,
  value,
}: InspectFieldProps): React.ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const ownsFocusRef = useRef(false);
  const columnName = column === null ? name : column.name;
  const label = formatColumnNameLabel(columnName);
  const fieldId = `cell-inspector-${columnName}`;
  const fieldLabelId = `${fieldId}-label`;
  const fieldRootId = `cell-inspector-field-${columnName}`;
  const presentation = useMemo(() => classifySchemaValue(value, column), [column, value]);
  const isBooleanColumn = column?.column_type.type === "Boolean";
  const isEnumColumn = column?.column_type.type === "Enum";
  const isStructuredColumnType = isStructuredColumn(column);
  const needsPrimitiveFieldText =
    presentation.kind === "text" ||
    presentation.kind === "number" ||
    presentation.kind === "boolean" ||
    presentation.kind === "enum";
  const fieldState = {
    isNull: value === null || value === undefined,
    text: needsPrimitiveFieldText === true ? safelyFormatValue(value, column) : "",
  };
  const structuredPresentation = useMemo(
    () =>
      column !== null && isStructuredColumnType === true && presentation.kind === "structured"
        ? safelySerializeStructuredValue(value, column)
        : null,
    [column, isStructuredColumnType, presentation.kind, value],
  );
  const usesJsonView = structuredPresentation?.fallback != null;
  const representationKind = `${presentation.kind}:${usesJsonView === true ? "json-view" : "field"}`;
  const usesNonNativeControl =
    isBooleanColumn === true ||
    isEnumColumn === true ||
    isStructuredColumnType === true ||
    usesJsonView === true ||
    presentation.kind === "bytes" ||
    presentation.kind === "timestamp" ||
    presentation.kind === "relation";

  useEffect(() => {
    const root = rootRef.current;
    if (root === null) {
      return;
    }

    focusField(root);
  }, [targetIdentity]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (
      root !== null &&
      ownsFocusRef.current === true &&
      root.contains(document.activeElement) === false
    ) {
      focusField(root);
    }
  }, [representationKind]);

  return (
    <Field.Root
      ref={rootRef}
      aria-labelledby={fieldLabelId}
      id={fieldRootId}
      tabIndex={-1}
      onFocusCapture={() => {
        ownsFocusRef.current = true;
      }}
      onBlurCapture={(event) => {
        ownsFocusRef.current =
          event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget);
      }}
    >
      <Box alignItems="start" justifyContent="between" gap="m">
        <Box alignItems="center" gap="s" minWidth={0}>
          <Field.Label
            id={fieldLabelId}
            htmlFor={usesNonNativeControl === true ? undefined : fieldId}
            nativeLabel={usesNonNativeControl === false}
          >
            <Text as="span">{label}</Text>
          </Field.Label>
          {formatColumnTypeLabel(column) !== null ? (
            <Text as="span" color="muted" variant="caption">
              {formatColumnTypeLabel(column)}
            </Text>
          ) : null}
        </Box>
      </Box>

      {presentation.kind === "unavailable" ? (
        <Input id={fieldId} aria-label={label} readOnly fullWidth value="Unavailable" />
      ) : presentation.kind === "bytes" ? (
        <BinaryDetails
          byteLength={presentation.byteLength}
          onCopy={(format) => copyBinaryValue(presentation.value, format)}
          onDownload={() => downloadBinaryValue(presentation.value, `${columnName}.bin`)}
        />
      ) : presentation.kind === "timestamp" ? (
        <TimestampDetails value={presentation.epochMilliseconds} />
      ) : presentation.kind === "relation" ? (
        <InspectRelationValue presentation={presentation} />
      ) : presentation.kind === "invalid" || presentation.kind === "unsupported" ? (
        <Input
          id={fieldId}
          aria-label={label}
          readOnly
          fullWidth
          value={presentation.displayValue}
        />
      ) : presentation.kind === "null" ? (
        <Input data-null-value id={fieldId} aria-label={label} readOnly fullWidth value="NULL" />
      ) : isBooleanColumn === true ? (
        <ToggleGroup
          disabled
          value={[getBooleanFieldValue(fieldState)]}
          width="full"
          itemWidth="equal"
          aria-labelledby={fieldLabelId}
        >
          <ToggleGroup.Item value="true">True</ToggleGroup.Item>
          <ToggleGroup.Item value="false">False</ToggleGroup.Item>
        </ToggleGroup>
      ) : isEnumColumn === true && column?.column_type.type === "Enum" ? (
        <Select.Root
          disabled
          items={column.column_type.variants.map((variant) => ({ label: variant, value: variant }))}
          value={fieldState.text.length === 0 ? null : fieldState.text}
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
        <CodeEditor
          id={fieldId}
          labelledBy={fieldLabelId}
          readOnly
          toolbarLabel={formatColumnTypeLabel(column)?.toUpperCase()}
          value={structuredPresentation?.source ?? fieldState.text}
        />
      ) : (
        <Input id={fieldId} value={fieldState.text} readOnly fullWidth />
      )}

      {column?.column_type.type === "Bytea" ? (
        <Field.Description>Read-only: binary field</Field.Description>
      ) : null}
    </Field.Root>
  );
}

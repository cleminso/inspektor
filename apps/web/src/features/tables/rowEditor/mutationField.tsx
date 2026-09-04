import { useMemo, useState, type RefCallback } from 'react'

import { Link } from '@tanstack/react-router'
import type { ColumnDescriptor } from 'jazz-tools'

import {
  BinaryDetails,
  Box,
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
} from '@inspektor/ds'

import { useInspectorSessionState } from '@app/providers/inspectorProvider'
import {
  formatColumnNameLabel,
  formatColumnTypeLabel,
  parseTimestampValue,
  safelySerializeStructuredValue,
} from '@tables/rowEditor/values/fieldPresentation'
import { focusRowEditorField } from '@tables/rowEditor/fieldFocus'
import { copyBinaryValue, downloadBinaryValue } from '@tables/rowEditor/values/binary'
import type { FieldReadOnlyReason } from '@tables/schema/fieldEditability'
import { isStructuredColumnType } from '@tables/schema/fieldType'
import { buildRelationTableLink } from '@tables/routing/buildRelationTableLink'
import {
  formatColumnDefault,
  setMutationFieldInputMode,
  setMutationFieldInputText,
  type MutationFieldInput,
  type MutationFieldMode,
} from '@tables/rowEditor/mutation/draft'

interface MutationFieldProps {
  canOmit: boolean
  column: ColumnDescriptor
  controlRef?: RefCallback<HTMLElement>
  error: string | undefined
  expanded: boolean
  input: MutationFieldInput
  focusOnMount?: boolean
  hidden: boolean
  idPrefix?: string
  initialValue: unknown
  onExpandedChange: (expanded: boolean) => void
  onInputChange: (input: MutationFieldInput) => void
  readOnlyReason: FieldReadOnlyReason
  sourceUnavailable?: boolean
  structuredEditorLayout?: CodeEditorLayout
}

interface NullInputGroupCheckboxProps {
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
}

type StructuredValueMode = 'default' | 'null' | 'value'

interface StructuredValueModeControlProps {
  describedBy?: string
  label: string
  mode: StructuredValueMode
  modes: readonly StructuredValueMode[]
  onModeChange: (mode: StructuredValueMode) => void
}

function StructuredValueModeControl({
  describedBy,
  label,
  mode,
  modes,
  onModeChange,
}: StructuredValueModeControlProps): React.ReactElement {
  return (
    <ToggleGroup<StructuredValueMode>
      aria-describedby={describedBy}
      aria-label={`${label} value mode`}
      size="s"
      value={[mode]}
      onValueChange={(nextModes) => {
        const nextMode = nextModes[0]
        if (nextMode !== undefined && nextMode !== mode) {
          onModeChange(nextMode)
        }
      }}
    >
      <ToggleGroup.Item
        data-value-mode-control={mode === 'value' ? '' : undefined}
        value="value"
      >
        Value
      </ToggleGroup.Item>
      {modes.includes('default') ? (
        <ToggleGroup.Item
          data-value-mode-control={mode === 'default' ? '' : undefined}
          value="default"
        >
          Default
        </ToggleGroup.Item>
      ) : null}
      {modes.includes('null') ? (
        <ToggleGroup.Item
          data-value-mode-control={mode === 'null' ? '' : undefined}
          value="null"
        >
          NULL
        </ToggleGroup.Item>
      ) : null}
    </ToggleGroup>
  )
}

interface StructuredValuePresentationProps {
  accessibilityLabel: string
  value: string
}

function StructuredValuePresentation({
  accessibilityLabel,
  value,
}: StructuredValuePresentationProps): React.ReactElement {
  return (
    <Input
      aria-label={accessibilityLabel}
      font="mono"
      fullWidth
      readOnly
      value={value}
    />
  )
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
  )
}

export function MutationField({
  canOmit,
  column,
  controlRef,
  error,
  expanded,
  input,
  focusOnMount = false,
  hidden,
  idPrefix = 'row-editor',
  initialValue,
  onExpandedChange,
  onInputChange,
  readOnlyReason,
  sourceUnavailable = false,
  structuredEditorLayout = 'fill',
}: MutationFieldProps): React.ReactElement {
  const { currentConnectionId } = useInspectorSessionState()
  const [valuePickerOpen, setValuePickerOpen] = useState(false)
  const label = formatColumnNameLabel(column.name)
  const fieldId = `${idPrefix}-${column.name}`
  const fieldLabelId = `${fieldId}-label`
  const isBooleanColumn = column.column_type.type === 'Boolean'
  const isBinaryColumn = column.column_type.type === 'Bytea'
  const isEnumColumn = column.column_type.type === 'Enum'
  const isStructured = isStructuredColumnType(column.column_type)
  const isTimestampColumn = column.column_type.type === 'Timestamp'
  const isReadOnly = readOnlyReason !== null
  const isEditableStructuredColumn = isStructured === true && isReadOnly === false
  const hasFieldError = error !== undefined && error.length > 0
  const showsReadOnlyDescription = readOnlyReason === 'binary'
  const showsSourceUnavailableDescription =
    sourceUnavailable === true && input.mode === 'value' && input.text.length === 0
  const showsDefaultDescription = column.default !== undefined && input.mode !== 'omitted'
  const readOnlyDescriptionId = `${fieldId}-read-only-description`
  const sourceUnavailableDescriptionId = `${fieldId}-source-unavailable-description`
  const defaultDescriptionId = `${fieldId}-default-description`
  const errorId = `${fieldId}-error`
  const descriptionIds = [
    showsReadOnlyDescription === true ? readOnlyDescriptionId : null,
    showsSourceUnavailableDescription === true ? sourceUnavailableDescriptionId : null,
    showsDefaultDescription === true ? defaultDescriptionId : null,
  ].filter((id) => id !== null)
  const guidanceDescribedBy = descriptionIds.join(' ') || undefined
  const describedBy =
    [...descriptionIds, hasFieldError === true ? errorId : null]
      .filter((id) => id !== null)
      .join(' ') || undefined
  const structuredPresentation = useMemo(
    () =>
      isStructured === true && input.mode !== 'null' && readOnlyReason !== null
        ? safelySerializeStructuredValue(initialValue, column)
        : null,
    [column, initialValue, input.mode, isStructured, readOnlyReason],
  )
  const usesJsonView = structuredPresentation?.fallback != null
  const usesNonNativeControl =
    input.mode !== 'omitted' &&
    (isBooleanColumn === true ||
      isBinaryColumn === true ||
      isEnumColumn === true ||
      isStructured === true)
  const relationTarget =
    column.references !== undefined && input.mode !== 'null' && input.text.trim().length > 0
      ? input.text.trim()
      : null
  const timestampValue = isTimestampColumn === true ? parseTimestampValue(input.text) : undefined
  const timestampTextIsEmpty = input.text.trim().length === 0
  const formattedDefault = column.default === undefined ? '' : formatColumnDefault(column)
  const defaultValue =
    column.default?.type === 'Null'
      ? 'NULL'
      : formattedDefault.length === 0
        ? '""'
        : formattedDefault
  const defaultDescriptionValue =
    column.default?.type === 'Null' || formattedDefault.length === 0
      ? defaultValue
      : column.column_type.type === 'Text' ||
          column.column_type.type === 'Uuid' ||
          column.column_type.type === 'Enum'
        ? JSON.stringify(defaultValue)
        : defaultValue
  const structuredValueMode: StructuredValueMode = input.mode === 'omitted' ? 'default' : input.mode
  const structuredValueModes: readonly StructuredValueMode[] = [
    'value',
    ...(canOmit === true ? (['default'] as const) : []),
    ...(column.nullable === true ? (['null'] as const) : []),
  ]
  const setInputMode = (mode: MutationFieldMode) => {
    onInputChange(setMutationFieldInputMode(input, column, mode))
  }
  const setNullablePickerMode = (checked: boolean) => {
    setInputMode(checked === true ? 'null' : 'value')
    setValuePickerOpen(checked === false)
  }
  const defaultCheckbox =
    canOmit === true && isStructured === false ? (
      <InputGroup.Checkbox
        label={`Use default for ${label}`}
        checked={input.mode === 'omitted'}
        tooltip={`Create this row with the default value: ${defaultDescriptionValue}. Turn off DEFAULT to enter a different value.`}
        onCheckedChange={(nextChecked) => setInputMode(nextChecked === true ? 'omitted' : 'value')}
      >
        DEFAULT
      </InputGroup.Checkbox>
    ) : null
  const defaultRestoreControl =
    canOmit === true && input.mode !== 'omitted' && isStructured === false ? (
      <InputGroup fullWidth>
        <Input
          aria-label={`${label} schema default`}
          font="mono"
          readOnly
          value={defaultValue}
        />
        {defaultCheckbox}
      </InputGroup>
    ) : null

  return (
    <Field.Root
      data-value-mode={
        input.mode === 'omitted'
          ? 'omitted'
          : isEditableStructuredColumn === true
            ? input.mode === 'null'
              ? 'null'
              : 'value'
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
        <Box
          alignItems="center"
          minWidth={0}
        >
          <Field.Label
            id={fieldLabelId}
            htmlFor={usesNonNativeControl === true ? undefined : fieldId}
            nativeLabel={usesNonNativeControl === false}
            render={usesNonNativeControl === true ? <Text as="span" /> : undefined}
            onClickCapture={
              isEditableStructuredColumn === true
                ? (event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    focusRowEditorField(column.name)
                  }
                : undefined
            }
          >
            {usesNonNativeControl === true ? label : <Text as="span">{label}</Text>}
          </Field.Label>
        </Box>
        {isEditableStructuredColumn === true && (canOmit === true || column.nullable === true) ? (
          <StructuredValueModeControl
            describedBy={guidanceDescribedBy}
            label={label}
            mode={structuredValueMode}
            modes={structuredValueModes}
            onModeChange={(nextMode) => setInputMode(nextMode === 'default' ? 'omitted' : nextMode)}
          />
        ) : null}
        {isEditableStructuredColumn === false ? (
          <Text
            as="span"
            color="muted"
            variant="caption"
          >
            {formatColumnTypeLabel(column)}
          </Text>
        ) : null}
      </Box>

      {input.mode === 'omitted' ? (
        isStructured === true ? (
          <StructuredValuePresentation
            accessibilityLabel={`${label} value: default`}
            value={defaultValue}
          />
        ) : (
          <InputGroup fullWidth>
            <Input
              id={fieldId}
              aria-label={label}
              disabled
              font="mono"
              value={defaultValue}
            />
            {defaultCheckbox}
          </InputGroup>
        )
      ) : isBooleanColumn === true ? (
        <ToggleGroup
          aria-describedby={describedBy}
          aria-invalid={hasFieldError === true ? true : undefined}
          value={
            input.mode === 'null'
              ? ['null']
              : input.text === 'true' || input.text === 'false'
                ? [input.text]
                : []
          }
          onValueChange={(values) => {
            const nextValue = values[0]
            if (nextValue === 'true' || nextValue === 'false') {
              onInputChange({ mode: 'value', text: nextValue })
            } else if (nextValue === 'null') {
              setInputMode('null')
            } else if (nextValue === 'default') {
              setInputMode('omitted')
            }
          }}
          width="full"
          itemWidth="equal"
          aria-labelledby={fieldLabelId}
        >
          <ToggleGroup.Item
            ref={controlRef}
            value="true"
          >
            True
          </ToggleGroup.Item>
          <ToggleGroup.Item value="false">False</ToggleGroup.Item>
          {column.nullable === true ? <ToggleGroup.Item value="null">Null</ToggleGroup.Item> : null}
          {canOmit === true ? <ToggleGroup.Item value="default">Default</ToggleGroup.Item> : null}
        </ToggleGroup>
      ) : isEnumColumn === true && column.column_type.type === 'Enum' ? (
        <Box
          flexDirection="column"
          gap="s"
        >
          <Select.Root
            disabled={input.mode === 'null'}
            open={valuePickerOpen}
            items={column.column_type.variants.map((variant) => ({
              label: variant,
              value: variant,
            }))}
            value={input.text.length === 0 ? null : input.text}
            onValueChange={(nextValue) => {
              if (typeof nextValue === 'string') {
                onInputChange(setMutationFieldInputText(input, nextValue))
              }
            }}
            onOpenChange={setValuePickerOpen}
          >
            <InputGroup fullWidth>
              <Select.Trigger
                ref={controlRef}
                id={fieldId}
                placeholder="Select value…"
                width="full"
              />
              {column.nullable === true && readOnlyReason === null ? (
                <NullInputGroupCheckbox
                  label={label}
                  checked={input.mode === 'null'}
                  onCheckedChange={setNullablePickerMode}
                />
              ) : null}
            </InputGroup>
            <Select.Content>
              {column.column_type.variants.map((variant) => (
                <Select.Item
                  key={variant}
                  value={variant}
                >
                  {variant}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          {defaultRestoreControl}
        </Box>
      ) : usesJsonView === true && structuredPresentation?.fallback != null ? (
        <JsonView
          accessibilityLabel={`${label} value`}
          data={structuredPresentation.fallback}
          describedBy={describedBy}
        />
      ) : isStructured === true ? (
        <>
          {input.mode === 'null' ? (
            <StructuredValuePresentation
              accessibilityLabel={`${label} value: NULL`}
              value="NULL"
            />
          ) : (
            <Box
              flexDirection="column"
              flexGrow={expanded === true ? 1 : 0}
              minHeight={expanded === true ? 0 : undefined}
              overflow={expanded === true ? 'hidden' : undefined}
            >
              <CodeEditor
                id={fieldId}
                labelledBy={fieldLabelId}
                describedBy={describedBy}
                expanded={expanded}
                focusOnMount={focusOnMount}
                invalid={hasFieldError}
                layout={expanded === true ? structuredEditorLayout : 'intrinsic'}
                readOnly={isReadOnly}
                onExpandedChange={onExpandedChange}
                value={structuredPresentation?.source ?? input.text}
                onValueChange={(text) => onInputChange(setMutationFieldInputText(input, text))}
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
          {input.mode === 'null' ? (
            <Input
              id={fieldId}
              aria-label={label}
              disabled
              font="mono"
              value=""
            />
          ) : (
            <DatePicker
              disabled={isReadOnly === true}
              open={valuePickerOpen}
              value={timestampValue}
              onApply={(nextValue) =>
                onInputChange(setMutationFieldInputText(input, nextValue.toISOString()))
              }
              onOpenChange={setValuePickerOpen}
            >
              <DatePicker.Trigger
                ref={controlRef}
                id={fieldId}
                aria-describedby={describedBy}
                aria-invalid={hasFieldError === true ? true : undefined}
                label={label}
              >
                {timestampValue === undefined ? (
                  'Select Date'
                ) : (
                  <TimestampValue value={timestampValue} />
                )}
              </DatePicker.Trigger>
              <DatePicker.Content />
            </DatePicker>
          )}
          {column.nullable === true && readOnlyReason === null ? (
            <NullInputGroupCheckbox
              label={label}
              checked={input.mode === 'null'}
              onCheckedChange={setNullablePickerMode}
            />
          ) : null}
          {defaultCheckbox}
        </InputGroup>
      ) : (
        <Box
          flexDirection="column"
          gap="s"
        >
          <InputGroup fullWidth>
            <Input
              ref={controlRef}
              id={fieldId}
              font="mono"
              value={input.text}
              disabled={input.mode === 'null'}
              readOnly={isReadOnly === true || isBinaryColumn === true}
              onValueChange={(text) => onInputChange(setMutationFieldInputText(input, text))}
            />
            {column.nullable === true && readOnlyReason === null ? (
              <NullInputGroupCheckbox
                label={label}
                checked={input.mode === 'null'}
                onCheckedChange={(checked) => setInputMode(checked === true ? 'null' : 'value')}
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

      {showsReadOnlyDescription === true ? (
        <Field.Description id={readOnlyDescriptionId}>Read-only: binary field</Field.Description>
      ) : null}
      {showsSourceUnavailableDescription === true ? (
        <Field.Description id={sourceUnavailableDescriptionId}>
          Unavailable source value.
        </Field.Description>
      ) : null}
      {showsDefaultDescription === true ? (
        <Field.Description id={defaultDescriptionId}>
          {canOmit === true
            ? input.mode === 'null'
              ? `NULL overrides the schema default: ${defaultDescriptionValue}.`
              : `Entered values override the schema default: ${defaultDescriptionValue}.`
            : `Schema default for new rows: ${defaultDescriptionValue}. Editing this field changes this row only.`}
        </Field.Description>
      ) : null}
      {hasFieldError === true ? (
        <Field.Error
          id={errorId}
          match
        >
          {error}
        </Field.Error>
      ) : null}
    </Field.Root>
  )
}

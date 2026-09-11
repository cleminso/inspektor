import type { ColumnDescriptor } from 'jazz-tools'

import { Box, Field, Input, JsonView, Text } from '@inspektor/ds'

import { TABLE_PROVENANCE_COLUMNS } from '@tables/tableProvenance'
import {
  formatColumnNameLabel,
  formatColumnTypeLabel,
} from '@tables/rowEditor/values/fieldPresentation'
import {
  createColumnJsonViewValue,
  isJsonViewContainer,
  type InspectorJsonValue,
} from '@tables/rowEditor/values/jsonView'

function formatPrimitiveValue(value: Exclude<InspectorJsonValue, object>): string {
  return value === null ? 'NULL' : String(value)
}

function ProvenanceField({
  column,
  value,
}: {
  column: ColumnDescriptor
  value: unknown
}): React.ReactElement {
  const label = formatColumnNameLabel(column.name)
  const normalizedValue = createColumnJsonViewValue(value, column.column_type)
  const isContainer = isJsonViewContainer(normalizedValue)

  return (
    <Field.Root id={`row-provenance-field-${column.name}`}>
      <Box
        alignItems="end"
        gap="m"
        justifyContent="between"
        width="full"
      >
        <Field.Label
          nativeLabel={isContainer === false}
          htmlFor={
            isContainer === false ? `row-provenance-${column.name}` : undefined
          }
          render={isContainer === true ? <Text as="span" /> : undefined}
        >
          {label}
        </Field.Label>
        <Text
          as="span"
          color="muted"
          variant="caption"
        >
          {formatColumnTypeLabel(column)}
        </Text>
      </Box>

      {isContainer === true ? (
        <JsonView
          accessibilityLabel={`${label} value`}
          data={normalizedValue}
        />
      ) : (
        <Input
          aria-label={label}
          font="mono"
          fullWidth
          id={`row-provenance-${column.name}`}
          readOnly
          value={formatPrimitiveValue(normalizedValue)}
        />
      )}
    </Field.Root>
  )
}

export function RowProvenanceFields({
  rowValues,
}: {
  rowValues: Readonly<Record<string, unknown>>
}): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="l"
    >
      {TABLE_PROVENANCE_COLUMNS.map((column) => (
        <ProvenanceField
          column={column}
          value={rowValues[column.name]}
          key={column.name}
        />
      ))}
    </Box>
  )
}

import type { ColumnDescriptor } from 'jazz-tools'

const authorColumnType: ColumnDescriptor['column_type'] = {
  type: 'Row',
  columns: [
    { name: 'account', column_type: { type: 'Uuid' }, nullable: false },
    {
      name: 'identity',
      column_type: {
        type: 'Row',
        columns: [
          { name: 'issuer', column_type: { type: 'Text' }, nullable: false },
          { name: 'subject', column_type: { type: 'Text' }, nullable: false },
        ],
      },
      nullable: false,
    },
  ],
}

/** Synthetic row metadata selected explicitly because Jazz's `*` projection excludes it. */
export const TABLE_PROVENANCE_COLUMNS = [
  { name: '$createdAt', column_type: { type: 'Timestamp' }, nullable: false },
  { name: '$createdBy', column_type: authorColumnType, nullable: false },
  { name: '$updatedAt', column_type: { type: 'Timestamp' }, nullable: false },
  { name: '$updatedBy', column_type: authorColumnType, nullable: false },
] as const satisfies readonly ColumnDescriptor[]

export type TableProvenanceColumnName = (typeof TABLE_PROVENANCE_COLUMNS)[number]['name']

export const TABLE_PROVENANCE_COLUMN_NAMES: readonly TableProvenanceColumnName[] =
  TABLE_PROVENANCE_COLUMNS.map((column) => column.name)

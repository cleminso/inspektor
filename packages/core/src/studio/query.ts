import { Deferred, Effect, Schema, type Scope } from 'effect'
import {
  getSupportedWhereOperatorsForColumn,
  TypedTableQueryBuilder,
  type ColumnDescriptor,
  type ColumnType,
  type QueryBuilder,
  type TableMeta,
  type WasmSchema,
  type WhereOperator,
} from 'jazz-tools'
import type { UseAllState } from 'jazz-tools/client'

export type DynamicTableRow = { id: string } & Record<string, unknown>
export type DynamicTableMeta = TableMeta<
  string,
  DynamicTableRow,
  Record<string, unknown>,
  Record<string, Partial<Record<WhereOperator, unknown>>>
>
export type TablePageSize = 100 | 500 | 1000
export type TableSortDirection = 'asc' | 'desc'
export interface TableFilterClause {
  readonly column: string
  readonly operator: WhereOperator
  readonly value: unknown
}
export interface TableQueryIntent {
  readonly tableName: string
  readonly filters: readonly TableFilterClause[]
  readonly sortColumn: string
  readonly sortDirection: TableSortDirection
  readonly page: number
  readonly pageSize: TablePageSize
}

export const tableProvenanceColumnNames = [
  '$createdAt',
  '$createdBy',
  '$updatedAt',
  '$updatedBy',
] as const

export class QueryIntentError extends Schema.TaggedError<QueryIntentError>()('QueryIntentError', {
  message: Schema.String,
  cause: Schema.Unknown,
}) {}

export function isTableColumnSortable(columnType: ColumnType): boolean {
  switch (columnType.type) {
    case 'Integer':
    case 'BigInt':
    case 'Double':
    case 'Boolean':
    case 'Text':
    case 'Enum':
    case 'Timestamp':
    case 'Uuid':
      return true
    default:
      return false
  }
}

export function resolveTableSortColumn(
  columns: readonly ColumnDescriptor[],
  sortColumn: string,
): string {
  return sortColumn === 'id' ||
    sortColumn === '$createdAt' ||
    sortColumn === '$updatedAt' ||
    columns.some(
      (column) => column.name === sortColumn && isTableColumnSortable(column.column_type),
    ) === true
    ? sortColumn
    : 'id'
}

function booleanValue(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  const text = String(value).trim().toLowerCase()
  if (text === 'true' || text === '1') return true
  if (text === 'false' || text === '0') return false
  throw new Error('Expected a boolean value.')
}

function scalarValue(columnType: ColumnType, value: unknown): unknown {
  if (columnType.type === 'Bytea' && value instanceof Uint8Array) return value
  const text = String(value).trim()
  if (text.length === 0) throw new Error('Value is required.')
  switch (columnType.type) {
    case 'Text':
      if (typeof value !== 'string') throw new Error('Expected text.')
      return text
    case 'Uuid':
      if (typeof value !== 'string' || text.length === 0) throw new Error('Expected an ID.')
      return text
    case 'Boolean':
      return booleanValue(value)
    case 'Integer': {
      const number = Number(text)
      if (Number.isSafeInteger(number) === false) throw new Error('Expected a safe integer.')
      return number
    }
    case 'Double': {
      const number = Number(text)
      if (Number.isFinite(number) === false) throw new Error('Expected a finite number.')
      return number
    }
    case 'BigInt':
      if (typeof value === 'number' && Number.isSafeInteger(value) === false) {
        throw new Error('Expected a safe integer.')
      }
      BigInt(text)
      return text
    case 'Timestamp': {
      const number =
        value instanceof Date
          ? value.getTime()
          : Number.isFinite(Number(text)) === true
            ? Number(text)
            : Date.parse(text)
      const timestamp = new Date(number).getTime()
      if (Number.isFinite(timestamp) === false) throw new Error('Expected a timestamp.')
      return timestamp
    }
    case 'Enum':
      if (columnType.variants.includes(text) === false) throw new Error('Unknown enum value.')
      return text
    case 'Bytea': {
      const bytes = text
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .map(Number)
      if (
        bytes.some((byte) => Number.isInteger(byte) === false || byte < 0 || byte > 255) === true
      ) {
        throw new Error('Expected bytes in range 0..255.')
      }
      return new Uint8Array(bytes)
    }
    case 'Json':
      if (typeof value !== 'string') return value
      try {
        const parsed: unknown = JSON.parse(text)
        return parsed
      } catch {
        return text
      }
    case 'Array': {
      const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value
      return parsed
    }
    default:
      return text
  }
}

export function parseTableFilterValue(
  column: Pick<ColumnDescriptor, 'column_type' | 'nullable'>,
  operator: WhereOperator,
  value: unknown,
): unknown {
  if (value === undefined) throw new Error('Filter value is required.')
  if (operator === 'isNull') return booleanValue(value)
  if (operator === 'in') {
    if (Array.isArray(value) === false || value.length === 0) {
      throw new Error('The in operator requires a nonempty array.')
    }
    return value.map((item: unknown) => scalarValue(column.column_type, item))
  }
  if (column.column_type.type === 'Text' && operator === 'eq' && typeof value === 'string') {
    return value
  }
  if (
    (column.column_type.type === 'Json' || column.column_type.type === 'Array') &&
    typeof value !== 'string' &&
    operator !== 'contains'
  )
    return value
  return scalarValue(
    operator === 'contains' && column.column_type.type === 'Array'
      ? column.column_type.element
      : column.column_type,
    value,
  )
}

/** Form text uses trimmed scalars; query equality separately preserves literal text. */
export function parseFilterValue(
  column: Pick<ColumnDescriptor, 'column_type' | 'nullable'>,
  operator: WhereOperator,
  value: string,
): unknown {
  if (operator === 'isNull') return booleanValue(value)
  if (operator === 'in') return parseFilterTokens(column, value.split(','))
  return scalarValue(
    operator === 'contains' && column.column_type.type === 'Array'
      ? column.column_type.element
      : column.column_type,
    value,
  )
}

export function parseFilterTokens(
  column: Pick<ColumnDescriptor, 'column_type'>,
  tokens: readonly string[],
): unknown[] {
  const items = tokens.map((token) => token.trim()).filter((token) => token.length > 0)
  if (items.length === 0) throw new Error('The in operator requires at least one value.')
  return items.map((item) => scalarValue(column.column_type, item))
}

export const tableIdFilterColumn = {
  name: 'id',
  column_type: { type: 'Uuid' },
  nullable: false,
} satisfies ColumnDescriptor

export function getFilterOperatorsForColumn(column: ColumnDescriptor): WhereOperator[] {
  return getSupportedWhereOperatorsForColumn({
    name: column.name,
    columnType: column.column_type,
    nullable: column.nullable,
    references: column.references,
  })
}

/** URL filters are best-effort input. Invalid or stale clauses do not fail a table query. */
export function filterTableFilterClauses<T extends TableFilterClause>({
  filters,
  schema,
  tableName,
}: {
  readonly filters: readonly T[]
  readonly schema: WasmSchema
  readonly tableName: string
}): T[] {
  const table = Object.hasOwn(schema, tableName) === true ? schema[tableName] : undefined
  if (table === undefined) return []
  return filters.flatMap((filter) => {
    const column =
      table.columns.find((candidate) => candidate.name === filter.column) ??
      (filter.column === 'id' ? tableIdFilterColumn : undefined)
    if (
      column === undefined ||
      getFilterOperatorsForColumn(column).includes(filter.operator) === false
    )
      return []
    if (filter.operator === 'isNull' && typeof filter.value !== 'boolean') return []
    if (filter.operator === 'in' && Array.isArray(filter.value) === false) return []
    try {
      const value =
        filter.operator === 'in' && Array.isArray(filter.value) === true
          ? parseFilterTokens(
              column,
              filter.value.map((item: unknown) => String(item)),
            )
          : filter.operator === 'isNull'
            ? filter.value
            : column.column_type.type === 'Text' &&
                filter.operator === 'eq' &&
                typeof filter.value === 'string'
              ? filter.value
              : (column.column_type.type === 'Json' || column.column_type.type === 'Array') &&
                  typeof filter.value !== 'string'
                ? filter.value
                : parseFilterValue(column, filter.operator, String(filter.value))
      return [{ ...filter, value }]
    } catch {
      return []
    }
  })
}

function tableBuilder(schema: WasmSchema, tableName: string) {
  if (Object.hasOwn(schema, tableName) === false) throw new Error('Unknown table.')
  return new TypedTableQueryBuilder<DynamicTableMeta>(tableName, schema).select(
    '*',
    ...tableProvenanceColumnNames,
  )
}

interface TableRowsQueryInput {
  readonly schema: WasmSchema
  readonly intent: TableQueryIntent
}

function tableRowsQuery(
  { schema, intent }: TableRowsQueryInput,
  policy: 'strict' | 'prune',
): Effect.Effect<QueryBuilder<DynamicTableRow>, QueryIntentError> {
  return Effect.try({
    try: () => {
      let builder = tableBuilder(schema, intent.tableName)
      const table = schema[intent.tableName]
      if (table === undefined) throw new Error('Unknown table.')
      if (
        Number.isSafeInteger(intent.page) === false ||
        intent.page < 1 ||
        [100, 500, 1000].includes(intent.pageSize) === false ||
        Number.isSafeInteger(intent.page * intent.pageSize) === false
      )
        throw new Error('Invalid page window.')
      if (intent.sortDirection !== 'asc' && intent.sortDirection !== 'desc') {
        throw new Error('Invalid sort direction.')
      }
      const sortColumn = resolveTableSortColumn(table.columns, intent.sortColumn)
      const sortDirection =
        sortColumn === 'id' && intent.sortColumn !== 'id' ? 'asc' : intent.sortDirection

      const filters =
        policy === 'prune'
          ? filterTableFilterClauses({
              filters: intent.filters,
              schema,
              tableName: intent.tableName,
            })
          : intent.filters
      for (const filter of filters) {
        const column =
          filter.column === 'id'
            ? tableIdFilterColumn
            : table.columns.find((candidate) => candidate.name === filter.column)
        if (column === undefined) throw new Error('Unknown filter column.')
        const operators = getFilterOperatorsForColumn(column)
        if (operators.includes(filter.operator) === false)
          throw new Error('Unsupported filter operator.')
        // Search parsing already normalized JSON strings and bytes. Do not parse them twice.
        const value =
          policy === 'prune'
            ? filter.value
            : parseTableFilterValue(column, filter.operator, filter.value)
        builder = builder.where({ [filter.column]: { [filter.operator]: value } })
      }
      builder = builder.orderBy(sortColumn, sortDirection)
      if (sortColumn !== 'id') builder = builder.orderBy('id', 'asc')
      return builder.limit(intent.pageSize + 1).offset((intent.page - 1) * intent.pageSize)
    },
    catch: (cause) => new QueryIntentError({ message: 'Invalid table query.', cause }),
  })
}

export const buildTableRowsQuery = Effect.fn('buildTableRowsQuery')((input: TableRowsQueryInput) =>
  tableRowsQuery(input, 'strict'),
)

/** URL input has best-effort filters; direct domain intent keeps explicit validation failures. */
export const buildTableRowsQueryFromSearch = Effect.fn('buildTableRowsQueryFromSearch')(
  (input: TableRowsQueryInput) => tableRowsQuery(input, 'prune'),
)

export const buildTableRowByIdQuery = Effect.fn('buildTableRowByIdQuery')(
  ({
    schema,
    tableName,
    rowId,
  }: {
    readonly schema: WasmSchema
    readonly tableName: string
    readonly rowId: string
  }): Effect.Effect<QueryBuilder<DynamicTableRow>, QueryIntentError> =>
    Effect.try({
      try: () => {
        if (rowId.length === 0) throw new Error('Row ID is required.')
        return tableBuilder(schema, tableName)
          .where({ id: { eq: rowId } })
          .limit(1)
      },
      catch: (cause) => new QueryIntentError({ message: 'Invalid row query.', cause }),
    }),
)

export function projectTablePage<T>(rows: readonly T[], pageSize: TablePageSize) {
  return { rows: rows.slice(0, pageSize), hasNextPage: rows.length > pageSize }
}

/** This is compatibility state, not a row cache; rows always come from Jazz.
 * @lat: [[exploreTables#Read result state]]
 */
export interface TableResultIdentity {
  readonly runtime: object
  readonly schema: WasmSchema
  readonly scopeKey: string
  readonly intent: TableQueryIntent
  readonly queryKey: string
}
export interface SettledTablePage {
  readonly identity: TableResultIdentity
  readonly rows: DynamicTableRow[]
  readonly hasNextPage: boolean
}

export function projectTableResult({
  identity,
  state,
  previous,
}: {
  readonly identity: TableResultIdentity
  readonly state: UseAllState<DynamicTableRow>
  readonly previous?: SettledTablePage | undefined
}) {
  if (state.status === 'rejected') return { status: 'rejected', error: state.error } as const
  if (state.status === 'fulfilled') {
    const page = { identity, ...projectTablePage(state.data, identity.intent.pageSize) }
    return {
      status: page.rows.length === 0 ? 'empty' : 'rows',
      page,
      correctPage: page.rows.length === 0 && identity.intent.page > 1,
      prepareNextPage: page.hasNextPage === true && identity.intent.pageSize === 100,
    } as const
  }
  const prior = previous?.identity
  if (
    previous !== undefined &&
    prior !== undefined &&
    prior.runtime === identity.runtime &&
    prior.schema === identity.schema &&
    prior.scopeKey === identity.scopeKey &&
    prior.queryKey !== identity.queryKey &&
    prior.intent.tableName === identity.intent.tableName &&
    prior.intent.page === identity.intent.page &&
    prior.intent.pageSize === identity.intent.pageSize &&
    (prior.intent.sortColumn !== identity.intent.sortColumn ||
      prior.intent.sortDirection !== identity.intent.sortDirection) &&
    JSON.stringify(prior.intent.filters) === JSON.stringify(identity.intent.filters)
  ) {
    return { status: 'refreshing', page: previous } as const
  }
  return { status: 'loading' } as const
}

export function projectRowById(state: UseAllState<DynamicTableRow>, rowId: string) {
  if (state.status === 'rejected') return { status: 'rejected', error: state.error } as const
  if (state.status === 'pending') return { status: 'pending' } as const
  const row = state.data.find((candidate) => candidate.id === rowId) ?? null
  return { status: 'fulfilled', row } as const
}

export type PreparationPolicy = 'ignore' | 'replace'
export type PreparationResult = 'busy' | 'committed' | 'recovery' | 'superseded' | 'unavailable'
export type QueryDiagnosis<Reason> =
  | { readonly status: 'reachable' }
  | { readonly status: 'connectionFailure'; readonly reason: Reason }

/**
 * One foreground attempt owns readiness, diagnosis, and its query lease through commit.
 * Ports own Jazz access and router effects; neither can authorize a retired attempt.
 * @lat: [[tableQueries#Preparation and lifetime]]
 */
export function createTableNavigationPreparation<Reason>(
  onPending: (tableName: string | null) => void,
) {
  let current: { cancelled: Deferred.Deferred<void> } | null = null
  const cancel = Effect.gen(function* () {
    const attempt = current
    current = null
    if (attempt !== null) yield* Deferred.succeed(attempt.cancelled, undefined)
    yield* Effect.sync(() => onPending(null))
  })
  const prepare = Effect.fn('prepareTableNavigation')(function* (request: {
    readonly policy: PreparationPolicy
    readonly tableName: string
    readonly query: Effect.Effect<unknown, unknown, Scope.Scope>
    readonly diagnose: Effect.Effect<QueryDiagnosis<Reason>, unknown>
    readonly repair: (reason: Reason) => Effect.Effect<void, unknown>
    readonly commit: Effect.Effect<void, unknown>
  }): Effect.fn.Return<PreparationResult, unknown> {
    if (current !== null) {
      if (request.policy === 'ignore') return 'busy'
      yield* cancel
    }
    const attempt = { cancelled: Deferred.makeUnsafe<void>() }
    current = attempt
    const workflow = Effect.gen(function* (): Effect.fn.Return<
      PreparationResult,
      unknown,
      Scope.Scope
    > {
      yield* Effect.sync(() => onPending(request.tableName))
      const readiness = yield* request.query.pipe(
        Effect.as('ready' as const),
        Effect.catch((queryError) =>
          Effect.gen(function* () {
            if (current !== attempt) return 'superseded' as const
            const diagnosis = yield* request.diagnose.pipe(
              Effect.catch(() => Effect.fail(queryError)),
            )
            if (current !== attempt) return 'superseded' as const
            if (diagnosis.status === 'connectionFailure') {
              yield* request.repair(diagnosis.reason)
              return current === attempt ? ('recovery' as const) : ('superseded' as const)
            }
            return yield* Effect.fail(queryError)
          }),
        ),
      )
      if (readiness !== 'ready') return readiness
      if (current !== attempt) return 'superseded'
      yield* request.commit
      return current === attempt ? 'committed' : 'superseded'
    })
    return yield* Effect.raceFirst(
      Effect.scoped(workflow),
      Deferred.await(attempt.cancelled).pipe(Effect.as('superseded' as const)),
    ).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          if (current !== attempt) return
          current = null
          onPending(null)
        }),
      ),
    )
  })
  return { prepare, cancel }
}

import {
  Box,
  Button,
  CopyButton,
  FindBar,
  JsonView,
  ScrollArea,
  Text,
  Tooltip,
  type FindBarSearchOptions,
  type FindBarState,
  type JsonViewSearchResults,
  type JsonViewValue,
} from '@inspector/ds'
import { Search, ChevronsUpDown, ChevronsDownUp } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  useRuntimePermissions,
  useRuntimePermissionsLoading,
  useRuntimeSchema,
} from '@app/providers/inspectorProvider'

interface SchemaViewProps {
  tableName: string
}

interface SchemaDocumentPanelProps {
  data: Record<string, JsonViewValue>
  defaultExpandDepth: 3 | 4
  documentName: 'permissions' | 'schema'
  title: 'Permissions' | 'Schema'
}

const defaultFindOptions: FindBarSearchOptions = {
  caseSensitive: false,
  wholeWord: false,
  regularExpression: false,
}

function SchemaDocumentPanel({
  data,
  defaultExpandDepth,
  documentName,
  title,
}: SchemaDocumentPanelProps): React.ReactElement {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFullyExpanded, setIsFullyExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOptions, setSearchOptions] = useState(defaultFindOptions)
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<JsonViewSearchResults>({
    activeIndex: null,
    count: 0,
    pending: false,
    query: '',
  })
  const serializedData = useMemo(() => JSON.stringify(data, null, 2), [data])
  const resultsMatchSearch = searchResults.query === searchQuery
  const findState: FindBarState =
    searchQuery.length === 0
      ? { status: 'idle' }
      : resultsMatchSearch === false && searchResults.query.length === 0
        ? { status: 'searching' }
        : searchResults.activeIndex === null
          ? { status: 'empty', pending: resultsMatchSearch === false || searchResults.pending }
          : {
              status: 'matched',
              activeIndex: searchResults.activeIndex,
              count: searchResults.count,
              pending: resultsMatchSearch === false || searchResults.pending,
            }
  const searchLabel = `Find ${documentName} JSON`
  const expansionLabel = isFullyExpanded ? `Collapse` : `Expand`

  function dismissSearch(): void {
    setIsSearchOpen(false)
    setSearchQuery('')
    setActiveMatchIndex(0)
    setSearchResults({
      activeIndex: null,
      count: 0,
      pending: false,
      query: '',
    })
  }

  return (
    <Box
      aria-label={title}
      as="section"
      minHeight={0}
      minWidth={0}
      flex={1}
      flexDirection="column"
      overflow="hidden"
    >
      <Box
        flexShrink={0}
        flexDirection="column"
        borderBottomWidth={1}
        borderColor="subtle"
        borderStyle="solid"
      >
        <Box
          height="panel-bar-height"
          alignItems="center"
          justifyContent="between"
          px="s"
        >
          <Text
            as="h2"
            variant="caption"
          >
            {title}
          </Text>
          <Box alignItems="center">
            <Tooltip.Root>
              <Tooltip.Trigger
                render={
                  <Button
                    aria-label={searchLabel}
                    aria-pressed={isSearchOpen}
                    glyphSize="compact"
                    iconOnly
                    onClick={() => {
                      if (isSearchOpen === true) {
                        dismissSearch()
                      } else {
                        setIsSearchOpen(true)
                      }
                    }}
                    size="s"
                    variant="ghost"
                  >
                    <Button.Glyph artwork={Search} />
                  </Button>
                }
              />
              <Tooltip.Content>{searchLabel}</Tooltip.Content>
            </Tooltip.Root>
            <Tooltip.Root>
              <Tooltip.Trigger
                render={
                  <Button
                    aria-label={expansionLabel}
                    aria-pressed={isFullyExpanded}
                    glyphSize="compact"
                    iconOnly
                    onClick={() => setIsFullyExpanded((current) => current === false)}
                    size="s"
                    variant="ghost"
                  >
                    <Button.Glyph
                      artwork={isFullyExpanded === true ? ChevronsDownUp : ChevronsUpDown}
                    />
                  </Button>
                }
              />
              <Tooltip.Content>{expansionLabel}</Tooltip.Content>
            </Tooltip.Root>
            <CopyButton
              label={`Copy ${documentName}`}
              size="s"
              textToCopy={serializedData}
              tooltipSide="bottom"
            />
          </Box>
        </Box>
        {isSearchOpen === true ? (
          <Box
            px="xs"
            pb="xs"
          >
            <FindBar
              // oxlint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              label={`Find in ${documentName}`}
              onDismiss={dismissSearch}
              onNextMatch={() => setActiveMatchIndex((searchResults.activeIndex ?? 0) + 1)}
              onPreviousMatch={() => setActiveMatchIndex((searchResults.activeIndex ?? 0) - 1)}
              onSearchOptionsChange={(nextOptions) => {
                setSearchOptions(nextOptions)
                setActiveMatchIndex(0)
              }}
              onValueChange={(nextValue) => {
                setSearchQuery(nextValue)
                setActiveMatchIndex(0)
              }}
              searchOptions={searchOptions}
              state={findState}
              value={searchQuery}
            />
          </Box>
        ) : null}
      </Box>
      <Box
        minHeight={0}
        flex={1}
        overflow="hidden"
      >
        <ScrollArea>
          <Box
            flex="none"
            flexDirection="column"
            padding="s"
          >
            <JsonView
              accessibilityLabel={`${title} JSON`}
              data={data}
              defaultExpandDepth={isFullyExpanded === true ? 'all' : defaultExpandDepth}
              key={isFullyExpanded === true ? 'all' : defaultExpandDepth}
              showRootActions={false}
              search={
                isSearchOpen === true
                  ? {
                      query: searchQuery,
                      ...searchOptions,
                      activeMatchIndex,
                      onResultsChange: setSearchResults,
                    }
                  : undefined
              }
            />
          </Box>
        </ScrollArea>
      </Box>
    </Box>
  )
}

function LoadedSchemaView({ tableName }: SchemaViewProps): React.ReactElement {
  const wasmSchema = useRuntimeSchema()
  const storedPermissions = useRuntimePermissions()
  const isPermissionsLoading = useRuntimePermissionsLoading()
  const tableSchema = wasmSchema?.[tableName] ?? null
  const tablePermissions = storedPermissions?.permissions?.[tableName] ?? null
  const schemaData = useMemo<Record<string, JsonViewValue>>(
    () => JSON.parse(JSON.stringify({ [tableName]: tableSchema })) as Record<string, JsonViewValue>,
    [tableName, tableSchema],
  )
  const permissionsData = useMemo<Record<string, JsonViewValue>>(
    () =>
      JSON.parse(JSON.stringify({ [tableName]: tablePermissions })) as Record<
        string,
        JsonViewValue
      >,
    [tableName, tablePermissions],
  )

  return (
    <Box
      height="full"
      minHeight={0}
      flex={1}
      flexDirection="column"
      overflow="hidden"
      backgroundColor="surface-background"
    >
      <Box
        minHeight={0}
        flex={1}
        flexDirection={{ base: 'column', xl: 'row' }}
        overflow="hidden"
      >
        <SchemaDocumentPanel
          data={schemaData}
          defaultExpandDepth={4}
          documentName="schema"
          title="Schema"
        />
        <Box
          aria-label="Schema document separator"
          aria-orientation="vertical"
          role="separator"
          display={{ base: 'none', xl: 'flex' }}
          width="panel-handle-size"
          alignSelf="stretch"
          flexShrink={0}
          borderLeftWidth={1}
          borderColor="subtle"
          borderStyle="solid"
        />
        {storedPermissions === null && isPermissionsLoading === true ? (
          <Box
            aria-label="Permissions"
            as="section"
            minHeight={0}
            minWidth={0}
            flex={1}
            padding="s"
          >
            <Text
              color="muted"
              variant="caption"
            >
              Loading permissions…
            </Text>
          </Box>
        ) : (
          <SchemaDocumentPanel
            data={permissionsData}
            defaultExpandDepth={3}
            documentName="permissions"
            title="Permissions"
          />
        )}
      </Box>
    </Box>
  )
}

export function SchemaView({ tableName }: SchemaViewProps): React.ReactElement {
  return (
    <LoadedSchemaView
      key={tableName}
      tableName={tableName}
    />
  )
}

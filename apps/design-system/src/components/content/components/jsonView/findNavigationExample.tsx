import {
  Box,
  FindBar,
  JsonView,
  type FindBarSearchOptions,
  type FindBarState,
  type JsonViewSearchResults,
} from '@inspector/ds'
import { useState } from 'react'

const result = {
  account: { id: 'account_01', status: 'active' },
  relatedAccountIds: ['account_02', 'account_03'],
}

export default function FindNavigationExample() {
  const [query, setQuery] = useState('account')
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const [searchOptions, setSearchOptions] = useState<FindBarSearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regularExpression: false,
  })
  const [results, setResults] = useState<JsonViewSearchResults>({
    activeIndex: null,
    count: 0,
    pending: false,
    query: "",
  })
  const state: FindBarState =
    query.length === 0
      ? { status: 'idle' }
      : results.query !== query && results.query.length === 0
        ? { status: 'searching' }
      : results.activeIndex === null
        ? { status: 'empty', pending: results.query !== query || results.pending }
        : {
            status: 'matched',
            activeIndex: results.activeIndex,
            count: results.count,
            pending: results.query !== query || results.pending,
          }

  return (
    <Box
      flexDirection="column"
      gap="m"
      width="full"
    >
      <FindBar
        label="Find in account JSON"
        value={query}
        onValueChange={(nextQuery) => {
          setQuery(nextQuery)
          setActiveMatchIndex(0)
        }}
        state={state}
        searchOptions={searchOptions}
        onSearchOptionsChange={(nextOptions) => {
          setSearchOptions(nextOptions)
          setActiveMatchIndex(0)
        }}
        onPreviousMatch={() => {
          setActiveMatchIndex((results.activeIndex ?? 0) - 1)
        }}
        onNextMatch={() => {
          setActiveMatchIndex((results.activeIndex ?? 0) + 1)
        }}
      />
      <JsonView
        accessibilityLabel="Account JSON"
        data={result}
        search={{ query, ...searchOptions, activeMatchIndex, onResultsChange: setResults }}
      />
    </Box>
  )
}

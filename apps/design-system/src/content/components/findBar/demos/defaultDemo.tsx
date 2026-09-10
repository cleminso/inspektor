import { Box, FindBar, type FindBarSearchOptions, type FindBarState } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

const matchCount = 6

export default function DefaultFindBarDemo(): ReactElement {
  const [value, setValue] = useState('account')
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchOptions, setSearchOptions] = useState<FindBarSearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regularExpression: false,
  })
  const state: FindBarState = { status: 'matched', activeIndex, count: matchCount }

  return (
    <Box width="popup-width-m">
      <FindBar
        label="Find in document"
        value={value}
        onValueChange={(nextValue) => {
          setValue(nextValue)
          setActiveIndex(0)
        }}
        state={state}
        searchOptions={searchOptions}
        onSearchOptionsChange={(nextOptions) => {
          setSearchOptions(nextOptions)
          setActiveIndex(0)
        }}
        onPreviousMatch={() => setActiveIndex((current) => (current - 1 + matchCount) % matchCount)}
        onNextMatch={() => setActiveIndex((current) => (current + 1) % matchCount)}
      />
    </Box>
  )
}

import { FindBar, type FindBarSearchOptions, type FindBarState } from '@inspector/ds'
import { type ReactElement, useState } from 'react'

const matchCount = 6

export default function BasicExample(): ReactElement {
  const [value, setValue] = useState('account')
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchOptions, setSearchOptions] = useState<FindBarSearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regularExpression: false,
  })
  const state: FindBarState =
    value.length === 0 ? { status: 'idle' } : { status: 'matched', activeIndex, count: matchCount }

  return (
    <FindBar
      label="Find in document"
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue)
        setActiveIndex(0)
      }}
      state={state}
      searchOptions={searchOptions}
      onSearchOptionsChange={setSearchOptions}
      onPreviousMatch={() => {
        setActiveIndex((current) => (current - 1 + matchCount) % matchCount)
      }}
      onNextMatch={() => {
        setActiveIndex((current) => (current + 1) % matchCount)
      }}
    />
  )
}

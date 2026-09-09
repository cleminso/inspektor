import { Box, FindBar, type FindBarSearchOptions, type FindBarState } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { findBarItem } from '@/lib/registry'

const matchCount = 6

export const findBarPlaygroundSource = `import { FindBar, type FindBarSearchOptions, type FindBarState } from "@inspektor/ds";
import { useState } from "react";

const matchCount = 6;

export default function Example() {
  const [value, setValue] = useState("account");
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchOptions, setSearchOptions] = useState<FindBarSearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regularExpression: false,
  });
  const state: FindBarState = value.length === 0
    ? { status: "idle" }
    : { status: "matched", activeIndex, count: matchCount };

  return (
    <FindBar
      label="Find in document"
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        setActiveIndex(0);
      }}
      state={state}
      searchOptions={searchOptions}
      onSearchOptionsChange={setSearchOptions}
      onPreviousMatch={() => setActiveIndex((current) => (current - 1 + matchCount) % matchCount)}
      onNextMatch={() => setActiveIndex((current) => (current + 1) % matchCount)}
    />
  );
}`

export function FindBarPlayground(): ReactElement {
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
    <ComponentDocsPage
      item={findBarItem}
      preview={
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
            onSearchOptionsChange={setSearchOptions}
            onPreviousMatch={() => {
              setActiveIndex((current) => (current - 1 + matchCount) % matchCount)
            }}
            onNextMatch={() => {
              setActiveIndex((current) => (current + 1) % matchCount)
            }}
          />
        </Box>
      }
      sourceCode={findBarPlaygroundSource}
    />
  )
}

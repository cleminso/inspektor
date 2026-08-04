import { Box, FindBar, type FindBarSearchOptions, type FindBarState } from '@inspector/ds'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { findBarItem } from '@/lib/registry'

const matchCount = 6

export const findBarPlaygroundSource = `import { FindBar, type FindBarSearchOptions, type FindBarState } from "@inspector/ds";
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
      onValueChange={setValue}
      state={state}
      searchOptions={searchOptions}
      onSearchOptionsChange={setSearchOptions}
      onPreviousMatch={() => setActiveIndex((current) => (current - 1 + matchCount) % matchCount)}
      onNextMatch={() => setActiveIndex((current) => (current + 1) % matchCount)}
    />
  );
}`

export function FindBarPlayground({ children }: { children?: ReactNode }): ReactElement {
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
      title={findBarItem.title}
      description={findBarItem.description}
      source={findBarItem.source}
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
    >
      {children}
    </ComponentDocsPage>
  )
}

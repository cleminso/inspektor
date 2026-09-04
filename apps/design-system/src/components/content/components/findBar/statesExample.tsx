import { Box, FindBar } from '@inspektor/ds'
import { type ReactElement } from 'react'

const searchOptions = {
  caseSensitive: false,
  wholeWord: false,
  regularExpression: false,
}

export default function StatesExample(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="m"
      width="full"
    >
      <FindBar
        label="Idle find"
        value=""
        onValueChange={() => undefined}
        state={{ status: 'idle' }}
        searchOptions={searchOptions}
        onSearchOptionsChange={() => undefined}
        onPreviousMatch={() => undefined}
        onNextMatch={() => undefined}
      />
      <FindBar
        label="Find with no matches"
        value="missing"
        onValueChange={() => undefined}
        state={{ status: 'empty' }}
        searchOptions={searchOptions}
        onSearchOptionsChange={() => undefined}
        onPreviousMatch={() => undefined}
        onNextMatch={() => undefined}
      />
    </Box>
  )
}

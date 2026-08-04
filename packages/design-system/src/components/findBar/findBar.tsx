import * as stylex from '@stylexjs/stylex'

import { Box } from '../box/box'
import { Button } from '../button/button'
import { Input } from '../input/input'
import { InputGroup } from '../inputGroup/inputGroup'
import { findBarStyles } from './findBar.styles'

export type FindBarState =
  | { status: 'idle' }
  | { status: 'empty' }
  | { status: 'matched'; activeIndex: number; count: number }

export interface FindBarSearchOptions {
  /** Matches uppercase and lowercase characters separately. */
  caseSensitive: boolean
  /** Matches the query only when it forms a complete word. */
  wholeWord: boolean
  /** Interprets the query as a regular expression. */
  regularExpression: boolean
}

export interface FindBarProps {
  /** Accessible name for the find query field. */
  label: string
  /** Query used to find document occurrences. */
  value: string
  /** Runs when the find query changes. */
  onValueChange: (value: string) => void
  /** Describes the result state displayed beside the query. */
  state: FindBarState
  /** Controls how the document interprets the find query. */
  searchOptions: FindBarSearchOptions
  /** Runs when a query interpretation option changes. */
  onSearchOptionsChange: (options: FindBarSearchOptions) => void
  /** Requests the preceding match, wrapping from the first match to the last. */
  onPreviousMatch: () => void
  /** Requests the following match, wrapping from the last match to the first. */
  onNextMatch: () => void
}

function PreviousIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...stylex.props(findBarStyles.icon)}
    >
      <path
        d="M8 13V3M4.5 6.5 8 3l3.5 3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function NextIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...stylex.props(findBarStyles.icon)}
    >
      <path
        d="M8 3v10m3.5-3.5L8 13l-3.5-3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MatchCaseIcon() {
  return <span {...stylex.props(findBarStyles.optionIcon)}>Aa</span>
}

function WholeWordIcon() {
  return <span {...stylex.props(findBarStyles.optionIcon, findBarStyles.wholeWordIcon)}>ab</span>
}

function RegularExpressionIcon() {
  return <span {...stylex.props(findBarStyles.optionIcon)}>.*</span>
}

export function FindBar({
  label,
  value,
  onValueChange,
  state,
  searchOptions,
  onSearchOptionsChange,
  onPreviousMatch,
  onNextMatch,
}: FindBarProps) {
  const hasMatches = state.status === 'matched'
  const statusText =
    state.status === 'matched'
      ? `${state.activeIndex + 1} of ${state.count}`
      : state.status === 'empty'
        ? 'No matches'
        : ''
  const statusLabel =
    state.status === 'matched'
      ? `Match ${state.activeIndex + 1} of ${state.count}`
      : state.status === 'empty'
        ? 'No matches'
        : undefined

  return (
    <Box
      alignItems="center"
      backgroundColor="bg-subtle"
      borderColor="border"
      borderRadius="xs"
      borderStyle="solid"
      borderWidth={1}
      data-slot="find-bar"
      gap="s"
      minWidth={0}
      padding="xs"
      width="full"
    >
      <Box
        flex={1}
        minWidth={0}
      >
        <InputGroup
          size="s"
          fullWidth
        >
          <Input
            aria-label={label}
            role="searchbox"
            type="text"
            placeholder="Find"
            value={value}
            onValueChange={(nextValue) => {
              onValueChange(nextValue)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || hasMatches === false) {
                return
              }

              event.preventDefault()
              if (event.shiftKey === true) {
                onPreviousMatch()
              } else {
                onNextMatch()
              }
            }}
          />
          <Box
            alignItems="center"
            flexShrink={0}
            gap="xxs"
            paddingRight="xxs"
          >
            <Button
              aria-label="Match case"
              aria-pressed={searchOptions.caseSensitive}
              iconOnly
              onClick={() => {
                onSearchOptionsChange({
                  ...searchOptions,
                  caseSensitive: searchOptions.caseSensitive === false,
                })
              }}
              radius="xs"
              size="xs"
              title="Match case"
              variant="ghost"
            >
              <MatchCaseIcon />
            </Button>
            <Button
              aria-label="Match whole word"
              aria-pressed={searchOptions.wholeWord}
              iconOnly
              onClick={() => {
                onSearchOptionsChange({
                  ...searchOptions,
                  wholeWord: searchOptions.wholeWord === false,
                })
              }}
              radius="xs"
              size="xs"
              title="Match whole word"
              variant="ghost"
            >
              <WholeWordIcon />
            </Button>
            <Button
              aria-label="Use regular expression"
              aria-pressed={searchOptions.regularExpression}
              iconOnly
              onClick={() => {
                onSearchOptionsChange({
                  ...searchOptions,
                  regularExpression: searchOptions.regularExpression === false,
                })
              }}
              radius="xs"
              size="xs"
              title="Use regular expression"
              variant="ghost"
            >
              <RegularExpressionIcon />
            </Button>
          </Box>
        </InputGroup>
      </Box>
      <Box
        alignItems="center"
        aria-label={statusLabel}
        as="span"
        color="text-muted"
        display="inline-flex"
        flexShrink={0}
        justifyContent="end"
        role={state.status === 'idle' ? undefined : 'status'}
        width="find-bar-status-width"
      >
        <span {...stylex.props(findBarStyles.status)}>{statusText}</span>
      </Box>
      <Box
        alignItems="center"
        flexShrink={0}
      >
        <Button
          aria-label="Previous match"
          disabled={hasMatches === false}
          iconOnly
          onClick={onPreviousMatch}
          radius="xs"
          size="xs"
          title="Previous match"
          variant="ghost"
        >
          <PreviousIcon />
        </Button>
        <Button
          aria-label="Next match"
          disabled={hasMatches === false}
          iconOnly
          onClick={onNextMatch}
          radius="xs"
          size="xs"
          title="Next match"
          variant="ghost"
        >
          <NextIcon />
        </Button>
      </Box>
    </Box>
  )
}

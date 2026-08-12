import * as stylex from '@stylexjs/stylex'

import { Box } from '../box/box'
import { Button } from '../button/button'
import { Input } from '../input/input'
import { InputGroup } from '../inputGroup/inputGroup'
import { Tooltip } from '../tooltip/tooltip'
import { findBarStyles } from './findBar.styles'

export type FindBarState =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'empty'; pending?: boolean }
  | { status: 'matched'; activeIndex: number; count: number; pending?: boolean }

export interface FindBarSearchOptions {
  /** Matches uppercase and lowercase characters separately. */
  caseSensitive: boolean
  /** Matches the query only when it forms a complete word. */
  wholeWord: boolean
  /** Interprets the query as a regular expression. */
  regularExpression: boolean
}

export interface FindBarProps {
  /** Moves focus to the query field when the Find Bar mounts. */
  autoFocus?: boolean
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
  /** Dismisses an optional Find Bar surface from the Escape key. */
  onDismiss?: () => void
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
  autoFocus = false,
  label,
  value,
  onValueChange,
  state,
  searchOptions,
  onSearchOptionsChange,
  onPreviousMatch,
  onNextMatch,
  onDismiss,
}: FindBarProps) {
  const pending = state.status !== 'idle' && state.status !== 'searching' && state.pending === true
  const hasMatches = state.status === 'matched'
  const canNavigate = hasMatches === true && pending === false
  const statusText =
    state.status === 'matched'
      ? `${state.activeIndex + 1} of ${state.count}`
      : state.status === 'empty'
        ? 'No matches'
        : state.status === 'searching'
          ? 'Searching…'
          : ''
  const statusLabel =
    state.status === 'matched'
      ? `Match ${state.activeIndex + 1} of ${state.count}`
      : state.status === 'empty'
        ? 'No matches'
        : state.status === 'searching'
          ? 'Searching'
          : undefined

  return (
    <Box
      alignItems="center"
      backgroundColor="surface-subtle"
      borderColor="default"
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
            // The optional transient Find Bar intentionally receives focus when its user action opens it.
            // oxlint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={autoFocus}
            aria-label={label}
            role="searchbox"
            type="text"
            placeholder="Find…"
            value={value}
            onValueChange={(nextValue) => {
              onValueChange(nextValue)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && onDismiss !== undefined) {
                event.preventDefault()
                onDismiss()
                return
              }

              if (event.key !== 'Enter' || canNavigate === false) {
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
            <Tooltip.Root>
              <Tooltip.Trigger
                render={
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
                    variant="ghost"
                  >
                    <MatchCaseIcon />
                  </Button>
                }
              />
              <Tooltip.Content>Match case</Tooltip.Content>
            </Tooltip.Root>
            <Tooltip.Root>
              <Tooltip.Trigger
                render={
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
                    variant="ghost"
                  >
                    <WholeWordIcon />
                  </Button>
                }
              />
              <Tooltip.Content>Match whole word</Tooltip.Content>
            </Tooltip.Root>
            <Tooltip.Root>
              <Tooltip.Trigger
                render={
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
                    variant="ghost"
                  >
                    <RegularExpressionIcon />
                  </Button>
                }
              />
              <Tooltip.Content>Use regular expression</Tooltip.Content>
            </Tooltip.Root>
          </Box>
        </InputGroup>
      </Box>
      <Box
        alignItems="center"
        aria-busy={pending === true ? true : undefined}
        aria-label={statusLabel}
        as="span"
        color="muted"
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
        <Tooltip.Root disabled={canNavigate === false}>
          <Tooltip.Trigger
            render={
              <Button
                aria-label="Previous match"
                aria-disabled={canNavigate === false ? true : undefined}
                disabled={hasMatches === false}
                iconOnly
                onClick={() => {
                  if (canNavigate === true) {
                    onPreviousMatch()
                  }
                }}
                radius="xs"
                size="xs"
                variant="ghost"
              >
                <PreviousIcon />
              </Button>
            }
          />
          <Tooltip.Content>Previous match</Tooltip.Content>
        </Tooltip.Root>
        <Tooltip.Root disabled={canNavigate === false}>
          <Tooltip.Trigger
            render={
              <Button
                aria-label="Next match"
                aria-disabled={canNavigate === false ? true : undefined}
                disabled={hasMatches === false}
                iconOnly
                onClick={() => {
                  if (canNavigate === true) {
                    onNextMatch()
                  }
                }}
                radius="xs"
                size="xs"
                variant="ghost"
              >
                <NextIcon />
              </Button>
            }
          />
          <Tooltip.Content>Next match</Tooltip.Content>
        </Tooltip.Root>
      </Box>
    </Box>
  )
}

import { Box, CopyButton } from '@inspektor/ds'
import * as stylex from '@stylexjs/stylex'
import { type ReactElement } from 'react'

import { useHighlightedCode } from '@/lib/shiki'

/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Overflowing source regions need keyboard scrolling. */

export function CodeBlock({ source }: { source: string }): ReactElement {
  const highlightedHtml = useHighlightedCode(source)
  const lineCount = source.split(/\r?\n/).length

  return (
    <Box
      as="section"
      aria-label="Example source"
      width="full"
      minWidth={0}
      borderTopWidth={1}
      borderStyle="solid"
      borderColor="default"
      overflow="hidden"
    >
      <Box
        display="block"
        width="full"
        minWidth={0}
        position="relative"
        backgroundColor="surface-background"
      >
        <Box
          position="absolute"
          right="l"
          top="l"
          zIndex="content"
        >
          <CopyButton
            textToCopy={source}
            label="Copy source"
          />
        </Box>
        {highlightedHtml !== null ? (
          <div
            data-docs-code-scroll
            role="region"
            aria-label="Source code"
            tabIndex={0}
            {...stylex.props(styles.codeContent)}
          >
            <span
              aria-hidden="true"
              data-docs-code-line-numbers
            >
              {Array.from({ length: lineCount }, (_, index) => (
                <span key={index}>{index + 1}</span>
              ))}
            </span>
            <div
              data-docs-code-content
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </div>
        ) : (
          <pre
            role="region"
            aria-label="Source code"
            tabIndex={0}
            {...stylex.props(styles.pre)}
          >
            <code>{source}</code>
          </pre>
        )}
      </Box>
    </Box>
  )
}

const styles = stylex.create({
  codeContent: {
    display: 'block',
    minWidth: 0,
    outlineOffset: -2,
    outlineStyle: {
      default: 'none',
      ':focus-visible': 'auto',
    },
    overflowX: 'auto',
    overflowY: 'hidden',
    position: 'relative',
    width: '100%',
  },
  pre: {
    boxSizing: 'border-box',
    color: 'inherit',
    fontFamily: "'Geist Mono Variable', ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSize: 13,
    lineHeight: '20px',
    margin: 0,
    minWidth: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '16px 48px 16px 16px',
    whiteSpace: 'pre',
    width: '100%',
  },
})

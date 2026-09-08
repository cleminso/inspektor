import { Accordion, Box, CopyButton } from '@inspektor/ds'
import * as stylex from '@stylexjs/stylex'
import { type ReactElement } from 'react'

import { useHighlightedCode } from '@/lib/shiki'

export function CodeBlock({ source }: { source: string }): ReactElement {
  const code = source.trim()
  const highlightedHtml = useHighlightedCode(code)

  return (
    <Box
      as="section"
      aria-label="Code"
      width="full"
      minWidth={0}
      backgroundColor="surface-background"
      borderRadius="xs"
      overflow="hidden"
    >
      <Accordion.Root>
        <Accordion.Item value="code">
          <Accordion.Header level={2}>
            <Accordion.Trigger>Code</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <Box
              display="block"
              width="full"
              minWidth={0}
              position="relative"
              backgroundColor="surface-background"
              data-docs-code-panel
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
                  data-docs-code-content
                  {...stylex.props(styles.codeContent)}
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
              ) : (
                <pre {...stylex.props(styles.pre)}>
                  <code>{code}</code>
                </pre>
              )}
            </Box>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </Box>
  )
}

const styles = stylex.create({
  codeContent: {
    display: 'block',
    minWidth: 0,
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
    padding: '16px 48px 16px 16px',
    whiteSpace: 'pre',
    width: '100%',
  },
})

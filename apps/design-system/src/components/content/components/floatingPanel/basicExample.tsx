import { Box, Button, FloatingPanel, Input, Text } from '@inspector/ds'
import { useId, useState, type ReactElement } from 'react'

type Presentation = 'editor' | 'failure' | 'review' | 'summary'

export default function BasicExample(): ReactElement {
  const contentId = useId()
  const reviewId = useId()
  const [open, setOpen] = useState(true)
  const [presentation, setPresentation] = useState<Presentation>('summary')
  const reviewExpanded = presentation === 'review'
  const showReview = () => setPresentation(reviewExpanded === true ? 'summary' : 'review')

  return (
    <Box flexDirection="column" gap="m" alignItems="center">
      <Button
        aria-controls={contentId}
        aria-expanded={open}
        size="s"
        variant="ghost"
        onClick={() => setOpen((currentOpen) => currentOpen === false)}
      >
        3 pending tasks
      </Button>
      {open === false ? null : (
        <FloatingPanel.Root aria-label="Background task controller">
          <FloatingPanel.Content
            id={contentId}
            size={reviewExpanded === true ? 'expanded' : 'compact'}
          >
            <FloatingPanel.Details
              open={reviewExpanded}
            >
              <Box
                as="section"
                aria-label="Affected tasks"
                id={reviewId}
                flexDirection="column"
                gap="s"
                padding="m"
              >
                <Text variant="label">Affected tasks</Text>
                <Text color="muted">2 updates · 1 removal</Text>
              </Box>
            </FloatingPanel.Details>
            {presentation === 'editor' ? (
              <Box flexDirection="column" gap="s" padding="m">
                <Text as="label" htmlFor="floating-panel-example-name" variant="label">
                  Task name
                </Text>
                <Input id="floating-panel-example-name" defaultValue="Rebuild index" fullWidth />
              </Box>
            ) : presentation === 'failure' ? (
              <Box flexDirection="column" gap="s" padding="m" role="alert">
                <Text color="error" variant="label">Couldn't complete one task</Text>
                <Text color="muted">Review the failed item and try again.</Text>
              </Box>
            ) : null}
            <FloatingPanel.Summary>
              <Box minWidth={0} flex={1}>
                <Button
                  aria-controls={reviewId}
                  aria-expanded={reviewExpanded}
                  size="s"
                  variant="ghost"
                  onClick={showReview}
                >
                  3 pending tasks
                </Button>
              </Box>
              <FloatingPanel.Actions>
                <Button size="s" variant="ghost" onClick={() => setPresentation('editor')}>
                  Edit
                </Button>
                <Button size="s" variant="ghost" onClick={() => setPresentation('failure')}>
                  Failure
                </Button>
              </FloatingPanel.Actions>
            </FloatingPanel.Summary>
          </FloatingPanel.Content>
        </FloatingPanel.Root>
      )}
    </Box>
  )
}

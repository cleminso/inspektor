import { Box, Button, Text } from '@inspektor/ds'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { type ReactElement } from 'react'

import { SourceLink } from '@/components/docs/sourceLink'
import { getAdjacentNavigationItems, type NavItem } from '@/lib/registry'

interface DocsHeaderProps {
  item: NavItem
}

export function DocsHeader({ item }: DocsHeaderProps): ReactElement {
  const navigate = useNavigate()
  const { previous: previousItem, next: nextItem } = getAdjacentNavigationItems(item.href)

  const navigatePrevious = (): void => {
    if (previousItem !== undefined) {
      void navigate({ to: previousItem.href })
    }
  }

  const navigateNext = (): void => {
    if (nextItem !== undefined) {
      void navigate({ to: nextItem.href })
    }
  }

  return (
    <Box
      as="header"
      alignItems="start"
      justifyContent="between"
      gap="l"
      flexShrink={0}
      padding="xl"
      borderBottomWidth={1}
      borderStyle="solid"
      borderColor="default"
      overflow="hidden"
    >
      <Box
        minWidth={0}
        flexDirection="column"
        gap="xs"
      >
        <SourceLink
          source={item.source}
          title={item.title}
        />
        <Text
          variant="body"
          color="muted"
        >
          {item.description}
        </Text>
      </Box>
      <Box
        alignItems="center"
        gap="none"
      >
        <Button
          variant="ghost"
          size="s"
          radius="s"
          iconOnly
          aria-label={
            previousItem !== undefined ? `Previous page: ${previousItem.title}` : 'No previous page'
          }
          disabled={previousItem === undefined}
          onClick={navigatePrevious}
        >
          <Button.Glyph artwork={ArrowLeft} />
        </Button>
        <Button
          variant="ghost"
          size="s"
          radius="s"
          iconOnly
          aria-label={nextItem !== undefined ? `Next page: ${nextItem.title}` : 'No next page'}
          disabled={nextItem === undefined}
          onClick={navigateNext}
        >
          <Button.Glyph artwork={ArrowRight} />
        </Button>
      </Box>
    </Box>
  )
}

import { Box, TextLink } from '@inspektor/ds'
import { ArrowRight } from 'lucide-react'
import { type ReactElement } from 'react'

export default function TextLinkUsageDemo(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="m"
    >
      <TextLink href="/components/text-link">View relation details</TextLink>
      <TextLink
        href="/components/tree"
        variant="caption"
        trailingIcon={<ArrowRight />}
      >
        Browse navigation components
      </TextLink>
    </Box>
  )
}

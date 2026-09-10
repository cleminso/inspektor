import { Box, Button, ButtonLink } from '@inspektor/ds'
import { ArrowRight } from 'lucide-react'
import { type ReactElement } from 'react'

export default function ButtonLinkNavigationDemo(): ReactElement {
  return (
    <Box
      alignItems="center"
      flexWrap="wrap"
      gap="m"
    >
      <ButtonLink href="/components/button-link">Open connection</ButtonLink>
      <ButtonLink
        href="/components/button-link"
        variant="secondary"
        suffix={<Button.Glyph artwork={ArrowRight} />}
      >
        View schema
      </ButtonLink>
    </Box>
  )
}

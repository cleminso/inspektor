import { Box, TextLink } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <Box
      flexDirection="column"
      alignItems="start"
      gap="m"
    >
      <TextLink
        href="https://base-ui.com"
        target="_blank"
        rel="noreferrer"
      >
        Base UI documentation
      </TextLink>
      <TextLink
        href="https://stylexjs.com"
        target="_blank"
        rel="noreferrer"
      >
        StyleX documentation
      </TextLink>
    </Box>
  )
}

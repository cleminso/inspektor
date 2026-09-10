import { Box, ButtonLink, Text } from '@inspektor/ds'
import { Link } from '@tanstack/react-router'
import { type ReactElement } from 'react'

export function HomePage(): ReactElement {
  return (
    <Box
      width="full"
      height="full"
      alignItems="center"
      justifyContent="center"
      padding="2xl"
    >
      <Box
        maxWidth="content-measure"
        flexDirection="column"
        gap="l"
      >
        <Text
          as="h1"
          variant="heading"
        >
          Inspektor Design System
        </Text>
        <Text
          variant="body"
          color="muted"
        >
          Guidance and executable examples for building consistent Inspektor interfaces.
        </Text>
        <ButtonLink render={<Link to="/components/button" />}>Browse components</ButtonLink>
      </Box>
    </Box>
  )
}

export function NotFoundPage(): ReactElement {
  return (
    <Box
      width="full"
      height="full"
      alignItems="center"
      justifyContent="center"
      padding="2xl"
    >
      <Box
        flexDirection="column"
        gap="m"
      >
        <Text
          as="h1"
          variant="heading"
        >
          Page not found
        </Text>
        <ButtonLink render={<Link to="/" />}>Return home</ButtonLink>
      </Box>
    </Box>
  )
}

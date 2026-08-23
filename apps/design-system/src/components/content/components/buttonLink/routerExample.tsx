import { ButtonLink } from '@inspector/ds'
import { Link as RouterLink } from '@tanstack/react-router'
import { type ReactElement } from 'react'

export default function RouterExample(): ReactElement {
  return (
    <ButtonLink
      variant="secondary"
      render={<RouterLink to="/components/button" />}
    >
      Read the Button documentation
    </ButtonLink>
  )
}

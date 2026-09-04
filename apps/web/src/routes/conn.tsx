import { createFileRoute } from '@tanstack/react-router'

import { ConnRoute } from './-connRoute'

export const Route = createFileRoute('/conn')({
  head: () => ({
    meta: [{ title: 'Connections | Inspektor' }],
  }),
  component: ConnRoute,
})

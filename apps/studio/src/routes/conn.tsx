import { createFileRoute } from '@tanstack/react-router'

import { formatStudioDocumentTitle } from '@shared/documentTitle'

import { ConnRoute } from './-connRoute'

export const Route = createFileRoute('/conn')({
  head: () => ({
    meta: [{ title: formatStudioDocumentTitle('Connections') }],
  }),
  component: ConnRoute,
})

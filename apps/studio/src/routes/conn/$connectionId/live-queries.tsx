import { createFileRoute } from '@tanstack/react-router'

import { formatStudioDocumentTitle } from '@shared/documentTitle'

export const Route = createFileRoute('/conn/$connectionId/live-queries')({
  head: () => ({
    meta: [{ title: formatStudioDocumentTitle('Live queries') }],
  }),
})

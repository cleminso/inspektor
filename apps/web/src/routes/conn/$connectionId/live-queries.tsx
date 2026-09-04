import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/conn/$connectionId/live-queries')({
  head: () => ({
    meta: [{ title: 'Live queries | Inspektor' }],
  }),
})

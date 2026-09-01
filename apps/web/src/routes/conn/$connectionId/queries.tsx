import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/conn/$connectionId/queries')({
  head: () => ({
    meta: [{ title: 'Query subscriptions | Inspector' }],
  }),
})

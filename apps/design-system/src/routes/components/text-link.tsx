import { createFileRoute } from '@tanstack/react-router'

import { TextLinkPage } from '@/components/content/components/textLink/page'

export const Route = createFileRoute('/components/text-link')({
  component: TextLinkPage,
  head: () => ({ meta: [{ title: 'Text Link · Inspektor Design System' }] }),
})

import { createFileRoute } from '@tanstack/react-router'

import { BinaryValuePage } from '@/components/content/components/binaryValue/page'

export const Route = createFileRoute('/components/binary-value')({
  component: BinaryValuePage,
  head: () => ({ meta: [{ title: 'Binary Value · Inspektor Design System' }] }),
})

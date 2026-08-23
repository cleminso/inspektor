import { createFileRoute } from '@tanstack/react-router'

import { TextFieldPage } from '@/components/content/components/textField/page'

export const Route = createFileRoute('/components/text-field')({
  component: TextFieldPage,
  head: () => ({
    meta: [{ title: 'Text Field · Inspector Design System' }],
  }),
})

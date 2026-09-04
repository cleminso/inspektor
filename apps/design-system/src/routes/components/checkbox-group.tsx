import { createFileRoute } from '@tanstack/react-router'

import { CheckboxGroupPage } from '@/components/content/components/checkboxGroup/page'

export const Route = createFileRoute('/components/checkbox-group')({
  component: CheckboxGroupPage,
  head: () => ({ meta: [{ title: 'Checkbox Group · Inspektor Design System' }] }),
})

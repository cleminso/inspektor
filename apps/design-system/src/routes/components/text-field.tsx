import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import TextFieldContent from '@/content/components/textField/page.mdx'
import { textFieldItem } from '@/lib/registry'

export const Route = createFileRoute('/components/text-field')({
  component: TextFieldPage,
  head: () => ({ meta: [{ title: 'Text Field · Inspektor Design System' }] }),
})

function TextFieldPage() {
  return (
    <ComponentPage item={textFieldItem}>
      <TextFieldContent />
    </ComponentPage>
  )
}

import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import KeyboardInputContent from '@/content/components/keyboardInput/page.mdx'
import { keyboardInputItem } from '@/lib/registry'

export const Route = createFileRoute('/components/keyboard-input')({
  component: KeyboardInputPage,
  head: () => ({ meta: [{ title: 'Keyboard Input · Inspektor Design System' }] }),
})

function KeyboardInputPage() {
  return (
    <ComponentPage item={keyboardInputItem}>
      <KeyboardInputContent />
    </ComponentPage>
  )
}

import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import CodeEditorContent from '@/content/components/codeEditor/page.mdx'
import { codeEditorItem } from '@/lib/registry'

export const Route = createFileRoute('/components/code-editor')({
  component: CodeEditorPage,
  head: () => ({ meta: [{ title: 'Code Editor · Inspektor Design System' }] }),
})

function CodeEditorPage() {
  return (
    <ComponentPage item={codeEditorItem}>
      <CodeEditorContent />
    </ComponentPage>
  )
}

import { createFileRoute } from '@tanstack/react-router'

import { CodeEditorPage } from '@/components/content/components/codeEditor/page'

export const Route = createFileRoute('/components/code-editor')({
  component: CodeEditorPage,
  head: () => ({ meta: [{ title: 'Code Editor · Inspector Design System' }] }),
})

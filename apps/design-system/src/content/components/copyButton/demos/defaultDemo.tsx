import { CopyButton } from '@inspektor/ds'
import { type ReactElement } from 'react'

const schemaHash = 'sha256:41f17cc82ca'

export default function DefaultCopyButtonDemo(): ReactElement {
  return (
      <CopyButton
        textToCopy={schemaHash}
        label="Copy schema hash"
      />
  )
}

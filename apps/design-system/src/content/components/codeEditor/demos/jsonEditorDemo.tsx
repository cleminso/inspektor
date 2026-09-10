import { Box, CodeEditor } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

const initialValue = JSON.stringify(
  { account: { id: 'account_01', role: 'admin' }, permissions: ['read', 'write'] },
  null,
  2,
)

export default function JsonEditorDemo(): ReactElement {
  const [value, setValue] = useState(initialValue)
  const [expanded, setExpanded] = useState(false)

  return (
    <Box
      minWidth={0}
      width="popup-width-l"
    >
      <CodeEditor
        accessibilityLabel="Account JSON"
        value={value}
        expanded={expanded}
        onValueChange={setValue}
        onExpandedChange={setExpanded}
      />
    </Box>
  )
}

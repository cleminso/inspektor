import { Box, JsonView } from '@inspektor/ds'
import { type ReactElement } from 'react'

const request = {
  method: 'POST',
  path: '/v1/deployments',
  headers: {
    'content-type': 'application/json',
  },
  body: {
    branch: 'main',
    production: true,
  },
}

export default function JsonViewCollapsedDemo(): ReactElement {
  return (
    <Box
      width="popup-width-m"
      minWidth={0}
    >
      <JsonView
        accessibilityLabel="Request payload"
        data={request}
        defaultExpandDepth={0}
      />
    </Box>
  )
}

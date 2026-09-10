import { Box, JsonView } from '@inspektor/ds'
import { type ReactElement } from 'react'

const deployment = {
  id: 'dpl_7Fh2K9',
  status: 'ready',
  production: true,
  regions: ['iad1', 'fra1'],
  source: {
    branch: 'main',
    commit: {
      sha: 'a1b2c3d',
      message: 'Add account settings',
    },
  },
  checks: [
    { name: 'build', status: 'passed', durationMs: 8421 },
    { name: 'tests', status: 'passed', durationMs: 3150 },
  ],
  rollbackOf: null,
}

export default function JsonViewDefaultDemo(): ReactElement {
  return (
    <Box
      width="popup-width-m"
      minWidth={0}
    >
      <JsonView
        accessibilityLabel="Deployment payload"
        data={deployment}
        defaultExpandDepth={1}
      />
    </Box>
  )
}

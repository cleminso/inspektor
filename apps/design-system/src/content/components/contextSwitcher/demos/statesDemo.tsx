import { Box, ContextSwitcher } from '@inspektor/ds'
import { type ReactElement } from 'react'

const contexts = ['Production', 'Preview']

function ContextOptions(): ReactElement {
  return (
    <ContextSwitcher.Content>
      <ContextSwitcher.Viewport>
        <ContextSwitcher.List>
          {(context: string) => (
            <ContextSwitcher.Item
              key={context}
              value={context}
            >
              {context}
            </ContextSwitcher.Item>
          )}
        </ContextSwitcher.List>
      </ContextSwitcher.Viewport>
    </ContextSwitcher.Content>
  )
}

export default function ContextSwitcherStatesDemo(): ReactElement {
  return (
    <Box
      alignItems="center"
      flexWrap="wrap"
      gap="m"
    >
      <ContextSwitcher.Root
        items={contexts}
        defaultValue="Production"
      >
        <ContextSwitcher.Trigger
          label="Switch compact context"
          size="s"
          width="s"
          tooltip="Current context"
        >
          <ContextSwitcher.Value />
        </ContextSwitcher.Trigger>
        <ContextOptions />
      </ContextSwitcher.Root>

      <ContextSwitcher.Root items={contexts}>
        <ContextSwitcher.Trigger
          label="Choose workspace"
          width="m"
        >
          <ContextSwitcher.Value placeholder="Choose a workspace" />
        </ContextSwitcher.Trigger>
        <ContextOptions />
      </ContextSwitcher.Root>

      <ContextSwitcher.Root
        items={contexts}
        defaultValue="Preview"
        disabled
      >
        <ContextSwitcher.Trigger label="Unavailable context">
          <ContextSwitcher.Value />
        </ContextSwitcher.Trigger>
      </ContextSwitcher.Root>
    </Box>
  )
}

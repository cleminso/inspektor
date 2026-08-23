import { ContextSwitcher } from '@inspector/ds'
import { type ReactElement } from 'react'

const branches = ['main', 'develop', 'feature/schema-view', 'fix/connection-state']

export default function SimpleExample(): ReactElement {
  return (
    <ContextSwitcher.Root
      items={branches}
      defaultValue="main"
    >
      <ContextSwitcher.Trigger
        label="Switch branch"
        size="s"
        width="s"
      >
        <ContextSwitcher.Value placeholder="Select branch" />
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Content width="s">
        <ContextSwitcher.Search
          label="Search branches"
          placeholder="Search branches"
        />
        <ContextSwitcher.Viewport maxHeight="s">
          <ContextSwitcher.List>
            {(branch: string) => (
              <ContextSwitcher.Item
                key={branch}
                value={branch}
              >
                {branch}
              </ContextSwitcher.Item>
            )}
          </ContextSwitcher.List>
        </ContextSwitcher.Viewport>
      </ContextSwitcher.Content>
    </ContextSwitcher.Root>
  )
}

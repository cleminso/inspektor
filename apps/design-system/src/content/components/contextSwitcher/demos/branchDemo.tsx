import { ContextSwitcher } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

const branches = ['main', 'develop', 'feature/schema-view', 'fix/connection-state']

export default function BranchContextSwitcherDemo(): ReactElement {
  const [branch, setBranch] = useState<string | null>('main')

  return (
    <ContextSwitcher.Root
      items={branches}
      value={branch}
      onValueChange={setBranch}
    >
      <ContextSwitcher.Trigger label="Switch branch">
        <ContextSwitcher.Value />
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Content>
        <ContextSwitcher.Search label="Search branches" />
        <ContextSwitcher.Viewport maxHeight="fiveItems">
          <ContextSwitcher.Empty>No matching branches.</ContextSwitcher.Empty>
          <ContextSwitcher.List>
            {(item: string) => (
              <ContextSwitcher.Item
                key={item}
                value={item}
              >
                {item}
              </ContextSwitcher.Item>
            )}
          </ContextSwitcher.List>
        </ContextSwitcher.Viewport>
      </ContextSwitcher.Content>
    </ContextSwitcher.Root>
  )
}

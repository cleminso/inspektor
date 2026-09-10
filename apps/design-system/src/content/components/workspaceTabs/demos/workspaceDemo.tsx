import {
  Box,
  Button,
  ContextMenu,
  Text,
  WorkspaceTabs,
  type WorkspaceTabsValue,
} from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

interface WorkspaceView {
  value: string
  label: string
  replaceable: boolean
}

const initialViews: WorkspaceView[] = [
  { value: 'all', label: 'All accounts', replaceable: false },
  { value: 'active', label: 'Active accounts', replaceable: false },
  { value: 'archived', label: 'Archived accounts', replaceable: true },
]

export default function WorkspaceTabsWorkspaceDemo(): ReactElement {
  const [views, setViews] = useState(initialViews)
  const [value, setValue] = useState('all')
  const [nextViewNumber, setNextViewNumber] = useState(1)

  const addView = (): void => {
    const nextValue = `custom-${nextViewNumber}`
    const nextView = {
      value: nextValue,
      label: `Accounts view ${nextViewNumber}`,
      replaceable: true,
    }
    setViews((currentViews) => {
      const replaceableIndex = currentViews.findIndex((view) => view.replaceable === true)
      return replaceableIndex === -1
        ? [...currentViews, nextView]
        : currentViews.map((view, index) => (index === replaceableIndex ? nextView : view))
    })
    setValue(nextValue)
    setNextViewNumber((current) => current + 1)
  }

  const closeView = (closingValue: WorkspaceTabsValue): void => {
    setViews((currentViews) => {
      const closingIndex = currentViews.findIndex((view) => view.value === closingValue)
      const remainingViews = currentViews.filter((view) => view.value !== closingValue)
      if (value === closingValue) {
        setValue(remainingViews[Math.max(0, closingIndex - 1)]?.value ?? '')
      }
      return remainingViews
    })
  }

  const keepOpen = (viewValue: string): void => {
    setViews((currentViews) =>
      currentViews.map((view) =>
        view.value === viewValue ? { ...view, replaceable: false } : view,
      ),
    )
  }

  const reorderViews = (orderedValues: WorkspaceTabsValue[]): void => {
    setViews((currentViews) => {
      const viewsByValue = new Map(currentViews.map((view) => [view.value, view]))
      return orderedValues.flatMap((orderedValue) => {
        const view = viewsByValue.get(String(orderedValue))
        return view === undefined ? [] : [view]
      })
    })
  }

  return (
    <Box
      width="full"
      flexDirection="column"
      gap="l"
    >
      <WorkspaceTabs.Root
        value={value}
        onValueChange={(nextValue) => setValue(String(nextValue ?? ''))}
      >
        <WorkspaceTabs.Bar>
          <WorkspaceTabs.List
            aria-label="Account table views"
            values={views.map((view) => view.value)}
            onReorder={reorderViews}
          >
            {views.map((view) => (
              <WorkspaceTabs.Tab
                key={view.value}
                value={view.value}
                retention={view.replaceable === true ? 'replaceable' : 'persistent'}
                closeLabel={`Close ${view.label}`}
                contextMenuItems={
                  view.replaceable === true ? (
                    <ContextMenu.Item onClick={() => keepOpen(view.value)}>
                      Keep open
                    </ContextMenu.Item>
                  ) : undefined
                }
                contextMenuLabel={view.replaceable === true ? `${view.label} actions` : undefined}
                reorderLabel={`Reorder ${view.label}`}
                onClose={closeView}
                onDoubleClick={view.replaceable === true ? () => keepOpen(view.value) : undefined}
              >
                {view.label}
              </WorkspaceTabs.Tab>
            ))}
          </WorkspaceTabs.List>
          <WorkspaceTabs.TrailingArea aria-label="Table view actions">
            <Button
              aria-label="Add table view"
              iconOnly
              variant="ghost"
              size="m"
              radius="m"
              onClick={addView}
            >
              +
            </Button>
          </WorkspaceTabs.TrailingArea>
        </WorkspaceTabs.Bar>
        {views.map((view) => (
          <WorkspaceTabs.Panel
            key={view.value}
            value={view.value}
          >
            <Text color="muted">{view.label} table state</Text>
          </WorkspaceTabs.Panel>
        ))}
      </WorkspaceTabs.Root>
    </Box>
  )
}

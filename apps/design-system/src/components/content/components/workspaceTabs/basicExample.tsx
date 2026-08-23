import { Box, Button, ContextMenu, WorkspaceTabs, Text } from '@inspector/ds'
import { type ReactElement, useState } from 'react'

const initialViews = [
  { value: 'all', label: 'All', replaceable: false },
  { value: 'active', label: 'Active accounts sorted by creation date', replaceable: false },
  { value: 'archived', label: 'Archived accounts', replaceable: true },
]

function TableIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      width="16"
      height="16"
    >
      <rect
        x="2.5"
        y="2.5"
        width="11"
        height="11"
        rx="1"
        stroke="currentColor"
      />
      <path
        d="M2.5 6h11M6 2.5v11"
        stroke="currentColor"
      />
    </svg>
  )
}

function PlusIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      width="16"
      height="16"
    >
      <path
        d="M8 3.5v9M3.5 8h9"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export default function BasicExample(): ReactElement {
  const [views, setViews] = useState(initialViews)
  const [value, setValue] = useState('all')
  const [nextViewNumber, setNextViewNumber] = useState(1)

  const closeView = (closingValue: string | number) => {
    const closingIndex = views.findIndex((view) => view.value === closingValue)
    const remainingViews = views.filter((view) => view.value !== closingValue)
    setViews(remainingViews)

    if (value === closingValue) {
      setValue(remainingViews[Math.max(0, closingIndex - 1)]?.value ?? '')
    }
  }

  const addView = () => {
    const nextValue = `custom-${nextViewNumber}`
    setViews((currentViews) => {
      const nextView = {
        value: nextValue,
        label: `Accounts view ${nextViewNumber}`,
        replaceable: true,
      }
      const replaceableIndex = currentViews.findIndex((view) => view.replaceable === true)
      return replaceableIndex === -1
        ? [...currentViews, nextView]
        : currentViews.map((view, index) => (index === replaceableIndex ? nextView : view))
    })
    setValue(nextValue)
    setNextViewNumber((currentNumber) => currentNumber + 1)
  }

  const keepOpen = (viewValue: string) => {
    setViews((currentViews) =>
      currentViews.map((view) =>
        view.value === viewValue ? { ...view, replaceable: false } : view,
      ),
    )
  }

  const reorderViews = (orderedValues: Array<string | number>) => {
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
        onValueChange={(nextValue) => setValue(String(nextValue))}
      >
        <WorkspaceTabs.Bar>
          <WorkspaceTabs.LeadingArea aria-label="View navigation">
            <Button
              aria-label="Previous view"
              iconOnly
              variant="ghost"
              size="m"
              radius="m"
            >
              ←
            </Button>
          </WorkspaceTabs.LeadingArea>
          <WorkspaceTabs.List
            aria-label="Account table views"
            values={views.map((view) => view.value)}
            onReorder={reorderViews}
          >
            {views.map((view) => (
              <WorkspaceTabs.Tab
                key={view.value}
                value={view.value}
                prefix={<TableIcon />}
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
              <PlusIcon />
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

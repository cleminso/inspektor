import { Box, Button, TabView, Text } from '@inspector/ds'
import { type ReactElement, useState } from 'react'

const initialViews = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active accounts sorted by creation date' },
  { value: 'archived', label: 'Archived accounts' },
]

function TableIcon(): ReactElement {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" width="16" height="16">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" stroke="currentColor" />
      <path d="M2.5 6h11M6 2.5v11" stroke="currentColor" />
    </svg>
  )
}

function PlusIcon(): ReactElement {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" width="16" height="16">
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" />
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
    setViews((currentViews) => [
      ...currentViews,
      { value: nextValue, label: `Filtered accounts ${nextViewNumber}` },
    ])
    setValue(nextValue)
    setNextViewNumber((currentNumber) => currentNumber + 1)
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
    <Box width="full" flexDirection="column" gap="l">
      <TabView.Root value={value} onValueChange={(nextValue) => setValue(String(nextValue))}>
        <Box width="full" minWidth={0} alignItems="center" gap="xs">
          <TabView.List
            aria-label="Account table views"
            values={views.map((view) => view.value)}
            onReorder={reorderViews}
          >
            {views.map((view) => (
              <TabView.Item
                key={view.value}
                value={view.value}
                details={view.value === 'active' ? 'Filtered account table view' : undefined}
                prefix={<TableIcon />}
                closeLabel={`Close ${view.label}`}
                reorderLabel={`Reorder ${view.label}`}
                onClose={closeView}
              >
                {view.label}
              </TabView.Item>
            ))}
          </TabView.List>
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
        </Box>
        {views.map((view) => (
          <TabView.Panel key={view.value} value={view.value}>
            <Text color="muted">{view.label} table state</Text>
          </TabView.Panel>
        ))}
      </TabView.Root>
    </Box>
  )
}

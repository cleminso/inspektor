import { ActionList, Box, Icon, Menu } from '@inspektor/ds'
import { MoreVertical, Table } from 'lucide-react'
import { type ReactElement, useState } from 'react'

const tables = ['accounts', 'sessions'] as const

export default function TableNavigationDemo(): ReactElement {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())

  const setChecked = (table: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current)
      if (checked === true) next.add(table)
      else next.delete(table)
      return next
    })
  }

  return (
    <Box width="popup-width-m">
      <ActionList
        aria-label="Tables"
        selectionControlsVisible={selected.size > 0}
        onEscapeKeyDown={(event) => {
          if (selected.size === 0) return
          setSelected(new Set())
          event.preventDefault()
        }}
      >
        {tables.map((table, index) => (
          <ActionList.Item
            key={table}
            active={index === 0}
            checked={selected.has(table)}
          >
            <ActionList.SelectionControl
              aria-label={`Select ${table}`}
              checked={selected.has(table)}
              icon={<Table aria-hidden="true" />}
              onCheckedChange={(checked) => setChecked(table, checked === true)}
            />
            <ActionList.Trigger aria-current={index === 0 ? 'page' : undefined}>
              {table}
            </ActionList.Trigger>
            {index === 0 ? (
              <Menu.Root>
                <Menu.Trigger render={<ActionList.Action aria-label={`Open ${table} actions`} />}>
                  <Icon
                    artwork={MoreVertical}
                    size="s"
                  />
                </Menu.Trigger>
                <Menu.Content>
                  <Menu.Item>Copy name</Menu.Item>
                  <Menu.Item variant="danger">Delete</Menu.Item>
                </Menu.Content>
              </Menu.Root>
            ) : null}
          </ActionList.Item>
        ))}
      </ActionList>
    </Box>
  )
}

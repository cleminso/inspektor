import { ActionList, ContextMenu, Menu } from '@inspector/ds'
import { type ReactElement, useState } from 'react'

function TableIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 14 14"
      width="14"
      height="14"
    >
      <path
        d="M2 2h10v10H2zM2 5.5h10M5.5 2v10"
        fill="none"
        stroke="currentColor"
      />
    </svg>
  )
}

function MoreIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
    >
      <circle
        cx="8"
        cy="3"
        r="1"
        fill="currentColor"
      />
      <circle
        cx="8"
        cy="8"
        r="1"
        fill="currentColor"
      />
      <circle
        cx="8"
        cy="13"
        r="1"
        fill="currentColor"
      />
    </svg>
  )
}

export default function BasicExample(): ReactElement {
  const [checkedNames, setCheckedNames] = useState<ReadonlySet<string>>(() => new Set())

  const setNameChecked = (name: string, checked: boolean) => {
    setCheckedNames((currentCheckedNames) => {
      const nextCheckedNames = new Set(currentCheckedNames)
      if (checked === true) {
        nextCheckedNames.add(name)
      } else {
        nextCheckedNames.delete(name)
      }
      return nextCheckedNames
    })
  }

  return (
    <ActionList
      aria-label="Tables"
      onEscapeKeyDown={(event) => {
        if (checkedNames.size === 0) {
          return
        }

        setCheckedNames(new Set())
        event.preventDefault()
      }}
    >
      <ActionList.Item
        active
        checked={checkedNames.has('accounts')}
      >
        <ActionList.SelectionControl
          aria-label="Select accounts"
          checked={checkedNames.has('accounts')}
          icon={<TableIcon />}
          onCheckedChange={(checked) => setNameChecked('accounts', checked === true)}
        />
        <ActionList.Trigger>accounts</ActionList.Trigger>
        <Menu.Root>
          <Menu.Trigger render={<ActionList.Action aria-label="Open account actions" />}>
            <MoreIcon />
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item>Copy name</Menu.Item>
            <Menu.Item variant="danger">Delete</Menu.Item>
          </Menu.Content>
        </Menu.Root>
      </ActionList.Item>
      <ContextMenu.Root>
        <ContextMenu.Trigger render={<ActionList.Item checked={checkedNames.has('sessions')} />}>
          <ActionList.SelectionControl
            aria-label="Select sessions"
            checked={checkedNames.has('sessions')}
            icon={<TableIcon />}
            onCheckedChange={(checked) => setNameChecked('sessions', checked === true)}
          />
          <ActionList.Trigger>sessions</ActionList.Trigger>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Copy name</ContextMenu.Item>
          <ContextMenu.Item variant="danger">Delete</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
    </ActionList>
  )
}

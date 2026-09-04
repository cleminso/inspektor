import { Button, Menu, Icon } from '@inspektor/ds'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { type ReactElement } from 'react'

export default function PrefixSuffixExample(): ReactElement {
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="secondary" />}>Edit</Menu.Trigger>
      <Menu.Content>
        <Menu.Item onClick={() => undefined}>
          <Menu.Prefix>
            <Icon
              artwork={Pencil}
              size="s"
            />
          </Menu.Prefix>
          Rename
          <Menu.Shortcut hotkey="F2" />
        </Menu.Item>
        <Menu.Item onClick={() => undefined}>
          <Menu.Prefix>
            <Icon
              artwork={Copy}
              size="s"
            />
          </Menu.Prefix>
          Duplicate
          <Menu.Shortcut hotkey="Mod+D" />
        </Menu.Item>
        <Menu.Item
          variant="danger"
          onClick={() => undefined}
        >
          <Menu.Prefix>
            <Icon
              artwork={Trash2}
              size="s"
            />
          </Menu.Prefix>
          Delete
          <Menu.Shortcut hotkey="Delete" />
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  )
}

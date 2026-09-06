import { Tree } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <Tree.Root aria-label="Design system navigation">
      <Tree.Section defaultOpen>
        <Tree.Trigger>Foundations</Tree.Trigger>
        <Tree.Content>
          <Tree.Item
            href="#colors"
            aria-current="page"
          >
            Colors
          </Tree.Item>
          <Tree.Item href="#typography">Typography</Tree.Item>
        </Tree.Content>
      </Tree.Section>
      <Tree.Section defaultOpen>
        <Tree.Trigger>Components</Tree.Trigger>
        <Tree.Content>
          <Tree.Item href="#accordion">Accordion</Tree.Item>
          <Tree.Item href="#button">Button</Tree.Item>
          <Tree.Item href="#tree">Tree</Tree.Item>
        </Tree.Content>
      </Tree.Section>
    </Tree.Root>
  )
}

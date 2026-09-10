import { Box, Tree } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function TreeNavigationDemo(): ReactElement {
  return (
    <Box
      width="popup-width-m"
      height="viewport-height-m"
    >
      <Tree.Root aria-label="Design system navigation">
        <Tree.Section defaultOpen>
          <Tree.Trigger>Foundations</Tree.Trigger>
          <Tree.Content>
            <Tree.Item
              href="/foundations/colors"
              aria-current="page"
            >
              Colors
            </Tree.Item>
            <Tree.Item href="/foundations/typography">Typography</Tree.Item>
          </Tree.Content>
        </Tree.Section>
        <Tree.Section defaultOpen>
          <Tree.Trigger>Components</Tree.Trigger>
          <Tree.Content>
            <Tree.Item href="/components/accordion">Accordion</Tree.Item>
            <Tree.Item href="/components/button">Button</Tree.Item>
            <Tree.Item href="/components/tree">Tree</Tree.Item>
          </Tree.Content>
        </Tree.Section>
      </Tree.Root>
    </Box>
  )
}

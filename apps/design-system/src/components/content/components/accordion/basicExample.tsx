import { Accordion, Text } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <Accordion defaultValue={['tables']}>
      <Accordion.Item value="tables">
        <Accordion.Header>
          <Accordion.Trigger suffix={<Text color="muted">14</Text>}>Tables</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>
          <Text color="muted">Table navigation content</Text>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="filters">
        <Accordion.Header>
          <Accordion.Trigger>Filters</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>
          <Text color="muted">Filter controls</Text>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}

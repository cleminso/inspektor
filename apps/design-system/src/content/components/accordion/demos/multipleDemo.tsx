import { Accordion, Box, Text } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function MultipleAccordionDemo(): ReactElement {
  return (
    <Box
      width="example-width"
      mx="auto"
    >
      <Accordion
        defaultValue={['schema', 'permissions']}
        multiple
      >
        <Accordion.Item value="schema">
          <Accordion.Header>
            <Accordion.Trigger>Schema</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <Text color="muted">Columns and relationships</Text>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="permissions">
          <Accordion.Header>
            <Accordion.Trigger>Permissions</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <Text color="muted">Read and write access</Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Box>
  )
}

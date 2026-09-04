import { Accordion, ActionList, Box } from '@inspektor/ds'

const tableNames = [
  'accounts',
  'comments',
  'documents',
  'events',
  'invoices',
  'messages',
  'organizations',
  'projects',
  'sessions',
  'users',
]

export default function FillExample() {
  return (
    <Box
      width="popup-width-m"
      height="viewport-height-s"
    >
      <Accordion
        defaultValue={['pinned', 'tables']}
        layout="fill"
        multiple
      >
        <Accordion.Item value="pinned">
          <Accordion.Header>
            <Accordion.Trigger>Pinned</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <ActionList aria-label="Pinned tables">
              {tableNames.slice(0, 2).map((tableName) => (
                <ActionList.Item key={tableName}>
                  <ActionList.Trigger>{tableName}</ActionList.Trigger>
                </ActionList.Item>
              ))}
            </ActionList>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="tables">
          <Accordion.Header>
            <Accordion.Trigger>Tables</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <ActionList aria-label="Tables">
              {tableNames.map((tableName) => (
                <ActionList.Item key={tableName}>
                  <ActionList.Trigger>{tableName}</ActionList.Trigger>
                </ActionList.Item>
              ))}
            </ActionList>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Box>
  )
}

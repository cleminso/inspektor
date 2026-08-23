import { JsonView } from '@inspector/ds'

const connection = {
  app: { id: 'co_z3f2', name: 'Storefront' },
  branches: [
    { name: 'main', active: true },
    { name: 'preview', active: false },
  ],
  schema: { tables: ['accounts', 'orders'] },
}

export default function DefaultExpansionExample() {
  return (
    <JsonView
      accessibilityLabel="Connection details"
      data={connection}
    />
  )
}

import { JsonView } from '@inspektor/ds'

const payload = {
  event: 'order.created',
  order: { id: 'order_42', total: 128.5 },
}

export default function CollapsedRootExample() {
  return (
    <JsonView
      accessibilityLabel="Collapsed event payload"
      data={payload}
      defaultExpandDepth={0}
    />
  )
}

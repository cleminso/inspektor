import { JsonView } from '@inspektor/ds'

const values = {
  object: {},
  array: [],
  nullable: null,
}

export default function EmptyValuesExample() {
  return (
    <JsonView
      accessibilityLabel="Empty and nullable values"
      data={values}
    />
  )
}

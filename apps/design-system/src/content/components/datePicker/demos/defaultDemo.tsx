import { DatePicker } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

const initialValue = new Date(2026, 7, 13, 12)

export default function DefaultDatePickerDemo(): ReactElement {
  const [value, setValue] = useState(initialValue)
  const [open, setOpen] = useState(false)

  return (
    <DatePicker
      value={value}
      open={open}
      onOpenChange={setOpen}
      onApply={(nextValue) => {
        setValue(nextValue)
        setOpen(false)
      }}
    >
      <DatePicker.Trigger label="Edit timestamp">{value.toLocaleString()}</DatePicker.Trigger>
      <DatePicker.Content />
    </DatePicker>
  )
}

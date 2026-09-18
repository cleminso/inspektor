import { createContext } from 'react'

import type { ToggleGroupSize } from './toggleGroup'

interface ToggleGroupContextValue {
  equalWidth: boolean
  size: ToggleGroupSize
}

export const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  equalWidth: false,
  size: 'm',
})

import { createContext } from 'react'

export type ButtonGroupOrientation = 'horizontal' | 'vertical'

export const ButtonGroupOrientationContext = createContext<ButtonGroupOrientation | null>(null)

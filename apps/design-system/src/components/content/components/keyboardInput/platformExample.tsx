import { KeyboardInput } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function PlatformExample(): ReactElement {
  return (
    <KeyboardInput
      hotkey="Mod+Shift+K"
      platform="mac"
      size="small"
      variant="outline"
    />
  )
}

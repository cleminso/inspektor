import * as stylex from '@stylexjs/stylex'
import { detectPlatform, formatForDisplay, type Hotkey } from '@tanstack/react-hotkeys'
import { useSyncExternalStore } from 'react'

import { keyboardInputStyles } from './keyboardInput.styles'

export type KeyboardInputPlatform = 'auto' | 'linux' | 'mac' | 'windows'
export type KeyboardInputSize = 'default' | 'small'
export type KeyboardInputVariant = 'default' | 'outline'
export type KeyboardInputHotkey = Hotkey

export interface KeyboardInputProps {
  /** Canonical TanStack Hotkeys shortcut to format for display. */
  hotkey: KeyboardInputHotkey
  /** Overrides automatic operating-system detection. */
  platform?: KeyboardInputPlatform
  /** Controls the shortcut hint's density. */
  size?: KeyboardInputSize
  /** Controls the shortcut hint's visual emphasis. */
  variant?: KeyboardInputVariant
}

const sizeStyles = {
  default: undefined,
  small: keyboardInputStyles.small,
} satisfies Record<KeyboardInputSize, unknown>

const variantStyles = {
  default: keyboardInputStyles.default,
  outline: keyboardInputStyles.outline,
} satisfies Record<KeyboardInputVariant, unknown>

/**
 * The browser platform does not change during a page session, so there is no external event source
 * to subscribe to. `useSyncExternalStore` still uses this stable subscription to coordinate its
 * server and client snapshots without creating a hydration mismatch.
 */
const subscribeToPlatform = () => () => undefined

/** Provides the deterministic snapshot used for server rendering and the hydration pass. */
const getServerPlatform = () => 'linux' as const

/** Formats a canonical TanStack hotkey for the selected or detected operating system. */
export function KeyboardInput({
  hotkey,
  platform = 'auto',
  size = 'default',
  variant = 'default',
}: KeyboardInputProps) {
  const detectedPlatform = useSyncExternalStore(
    subscribeToPlatform,
    detectPlatform,
    getServerPlatform,
  )
  const resolvedPlatform = platform === 'auto' ? detectedPlatform : platform
  const formatOptions = { platform: resolvedPlatform }
  const visualName = formatForDisplay(hotkey, formatOptions)
  const accessibleName = formatForDisplay(hotkey, { ...formatOptions, useSymbols: false })

  return (
    <kbd
      aria-label={accessibleName}
      data-platform={platform}
      data-size={size}
      data-slot="keyboard-input"
      data-variant={variant}
      {...stylex.props(keyboardInputStyles.root, sizeStyles[size], variantStyles[variant])}
    >
      <span
        aria-hidden="true"
        {...stylex.props(keyboardInputStyles.glyph)}
      >
        {visualName}
      </span>
    </kbd>
  )
}

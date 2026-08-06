import * as stylex from '@stylexjs/stylex'

import { spinnerStyles } from './spinner.styles'

export type SpinnerSize = 's' | 'm' | 'l'

export interface SpinnerProps {
  /** Provides an accessible status label. Omit when another control communicates the busy state. */
  label?: string
  /** Controls the spinner dimensions. */
  size?: SpinnerSize
}

const sizeStyles = {
  s: spinnerStyles.sizeS,
  m: spinnerStyles.sizeM,
  l: spinnerStyles.sizeL,
} satisfies Record<SpinnerSize, unknown>

export function Spinner({ label, size = 'm' }: SpinnerProps) {
  const styleProps = stylex.props(spinnerStyles.base, sizeStyles[size])

  return (
    <svg
      aria-hidden={label === undefined ? true : undefined}
      aria-label={label}
      className={styleProps.className}
      data-slot="spinner"
      fill="none"
      role={label === undefined ? undefined : 'status'}
      style={styleProps.style}
      viewBox="0 0 24 24"
    >
      <path d="M12 2v3" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
      <path d="m17 3.34-1.5 2.6" stroke="currentColor" strokeLinecap="round" strokeOpacity=".92" strokeWidth="2.5" />
      <path d="m20.66 7-2.6 1.5" stroke="currentColor" strokeLinecap="round" strokeOpacity=".84" strokeWidth="2.5" />
      <path d="M22 12h-3" stroke="currentColor" strokeLinecap="round" strokeOpacity=".76" strokeWidth="2.5" />
      <path d="m20.66 17-2.6-1.5" stroke="currentColor" strokeLinecap="round" strokeOpacity=".68" strokeWidth="2.5" />
      <path d="m17 20.66-1.5-2.6" stroke="currentColor" strokeLinecap="round" strokeOpacity=".6" strokeWidth="2.5" />
      <path d="M12 22v-3" stroke="currentColor" strokeLinecap="round" strokeOpacity=".52" strokeWidth="2.5" />
      <path d="m7 20.66 1.5-2.6" stroke="currentColor" strokeLinecap="round" strokeOpacity=".44" strokeWidth="2.5" />
      <path d="m3.34 17 2.6-1.5" stroke="currentColor" strokeLinecap="round" strokeOpacity=".36" strokeWidth="2.5" />
      <path d="M2 12h3" stroke="currentColor" strokeLinecap="round" strokeOpacity=".28" strokeWidth="2.5" />
      <path d="m3.34 7 2.6 1.5" stroke="currentColor" strokeLinecap="round" strokeOpacity=".2" strokeWidth="2.5" />
      <path d="m7 3.34 1.5 2.6" stroke="currentColor" strokeLinecap="round" strokeOpacity=".12" strokeWidth="2.5" />
    </svg>
  )
}

import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'

import { useClipboard } from '../../hooks/useClipboard'
import {
  Button,
  type ButtonSize,
  type ButtonVariant,
} from '../button/button'
import { Tooltip, type TooltipContentProps } from '../tooltip/tooltip'
import { copyButtonStyles } from './copyButton.styles'

export type CopyButtonSize = ButtonSize
export type CopyButtonVariant = Extract<
  ButtonVariant,
  'ghost' | 'secondary'
>

export interface CopyButtonProps {
  /** Text written to the clipboard when the button is activated. */
  textToCopy: string
  /** Accessible action label that identifies what will be copied. */
  label: string
  /** Feedback shown after the text is copied. */
  copiedLabel?: string
  /** Feedback shown when the clipboard operation fails. */
  errorLabel?: string
  /** Controls the square button size. */
  size?: CopyButtonSize
  /** Controls the visual treatment and emphasis of the copy action. */
  variant?: CopyButtonVariant
  /** Prevents the copy action and its tooltip from being activated. */
  disabled?: boolean
  /** Places the feedback tooltip on this side of the button. */
  tooltipSide?: TooltipContentProps['side']
  /** Runs after text is successfully written to the clipboard. */
  onCopy?: () => void
  /** Runs when writing text to the clipboard fails. */
  onCopyError?: (error: Error) => void
}

const CopyArtwork = forwardRef<SVGSVGElement, ComponentPropsWithoutRef<'svg'>>(
  function CopyArtwork(props, ref) {
    return (
      <svg
        {...props}
        ref={ref}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <rect height="12" rx="1" width="12" x="8" y="8" />
        <path d="M16 6V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" />
      </svg>
    )
  },
)

const CheckArtwork = forwardRef<SVGSVGElement, ComponentPropsWithoutRef<'svg'>>(
  function CheckArtwork(props, ref) {
    return (
      <svg
        {...props}
        ref={ref}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path d="m5 12 4 4L19 6" />
      </svg>
    )
  },
)

export function CopyButton({
  textToCopy,
  label,
  copiedLabel = 'Copied',
  errorLabel = 'Could not copy',
  size = 's',
  variant = 'ghost',
  disabled = false,
  tooltipSide = 'top',
  onCopy,
  onCopyError,
}: CopyButtonProps) {
  const { copied, error, copy } = useClipboard()
  const visuallyHiddenStyleProps = stylex.props(copyButtonStyles.visuallyHidden)
  const feedback = error !== null ? errorLabel : copied === true ? copiedLabel : label

  const handleCopy = async () => {
    try {
      await copy(textToCopy)
    } catch (copyError) {
      onCopyError?.(copyError instanceof Error ? copyError : new Error(errorLabel))
      return
    }

    onCopy?.()
  }

  return (
    <Tooltip.Root disabled={disabled}>
      <Tooltip.Trigger
        render={
          <Button
            aria-label={label}
            disabled={disabled}
            iconOnly
            onClick={() => void handleCopy()}
            size={size}
            variant={variant}
          >
            <Button.Glyph artwork={copied === true ? CheckArtwork : CopyArtwork} />
          </Button>
        }
      />
      <Tooltip.Content side={tooltipSide}>{feedback}</Tooltip.Content>
      <span
        aria-live="polite"
        className={visuallyHiddenStyleProps.className}
        style={visuallyHiddenStyleProps.style}
      >
        {copied === true || error !== null ? feedback : ''}
      </span>
    </Tooltip.Root>
  )
}

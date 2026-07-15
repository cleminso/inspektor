import * as stylex from '@stylexjs/stylex'

import { useClipboard } from '../../hooks/useClipboard'
import { Button } from '../button/button'
import { Tooltip, type TooltipContentProps } from '../tooltip/tooltip'
import { copyButtonStyles } from './copyButton.styles'

export type CopyButtonSize = 'icon-s' | 'icon-m' | 'icon-l'
export type CopyButtonVariant = 'ghost' | 'secondary' | 'outline'

export interface CopyButtonProps {
  /** Text written to the clipboard when the button is activated. */
  textToCopy: string
  /** Accessible action label that identifies what will be copied. */
  label: string
  /** Feedback shown after the text is copied. */
  copiedLabel?: string
  /** Feedback shown when the clipboard operation fails. */
  errorLabel?: string
  /** Controls the square button and icon size. */
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

const iconSizeStyles = {
  'icon-s': copyButtonStyles.iconS,
  'icon-m': copyButtonStyles.iconM,
  'icon-l': copyButtonStyles.iconL,
} satisfies Record<CopyButtonSize, unknown>

function CopyIcon({ size }: { size: CopyButtonSize }) {
  const iconStyleProps = stylex.props(copyButtonStyles.icon, iconSizeStyles[size])

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...iconStyleProps}>
      <rect height="12" rx="1" width="12" x="8" y="8" />
      <path d="M16 6V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" />
    </svg>
  )
}

function CheckIcon({ size }: { size: CopyButtonSize }) {
  const iconStyleProps = stylex.props(copyButtonStyles.icon, iconSizeStyles[size])

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...iconStyleProps}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

export function CopyButton({
  textToCopy,
  label,
  copiedLabel = 'Copied',
  errorLabel = 'Could not copy',
  size = 'icon-s',
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
            onClick={() => void handleCopy()}
            size={size}
            variant={variant}
          >
            {copied === true ? <CheckIcon size={size} /> : <CopyIcon size={size} />}
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

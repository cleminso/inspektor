import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'

import { Input } from '../input/input'
import { InputGroup } from '../inputGroup/inputGroup'
import { Menu } from '../menu/menu'
import { toasts } from '../toaster/toaster'
import { binaryValueStyles } from './binaryValue.styles'

export type BinaryCopyFormat = 'hex' | 'base64'

export interface BinaryValueProps {
  /** Non-negative safe integer byte count. Invalid counts render an explicit fallback. */
  byteLength: number
}

export interface BinaryDetailsProps extends BinaryValueProps {
  /** Copies the binary value in an application-provided text format. */
  onCopy: (format: BinaryCopyFormat) => void | Promise<void>
  /** Starts an application-owned download of the binary value. */
  onDownload: () => void | Promise<void>
}

const byteUnits = ['B', 'KB', 'MB', 'GB', 'TB'] as const
const copyFormatLabels = {
  hex: 'Hex',
  base64: 'Base64',
} satisfies Record<BinaryCopyFormat, string>

function formatByteCount(byteCount: number): string {
  if (Number.isSafeInteger(byteCount) === false || byteCount < 0) {
    return 'Invalid byte count'
  }

  if (byteCount < 1_024) {
    return `${byteCount}B`
  }

  const unitIndex = Math.min(
    Math.floor(Math.log(byteCount) / Math.log(1_024)),
    byteUnits.length - 1,
  )
  const amount = byteCount / 1_024 ** unitIndex
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(amount)}${byteUnits[unitIndex]}`
}

export function BinaryValue({ byteLength }: BinaryValueProps) {
  return (
    <span
      data-typography="mono"
      {...stylex.props(binaryValueStyles.preview)}
    >
      {formatByteCount(byteLength)}
    </span>
  )
}

export function BinaryDetails({ byteLength, onCopy, onDownload }: BinaryDetailsProps) {
  const [feedback, setFeedback] = useState('')
  const byteCount = formatByteCount(byteLength)
  const isValidByteCount = byteCount !== 'Invalid byte count'

  const copyAs = async (format: BinaryCopyFormat) => {
    const label = copyFormatLabels[format]
    try {
      await onCopy(format)
      const message = `Copied as ${label}`
      setFeedback(message)
      toasts.success(message)
    } catch {
      const message = `Could not copy as ${label}`
      setFeedback(message)
      toasts.error(message)
    }
  }

  const download = async () => {
    try {
      await onDownload()
      setFeedback('Download started')
      toasts.success('Download started')
    } catch {
      setFeedback('Could not download')
      toasts.error('Could not download')
    }
  }

  return (
    <div
      {...stylex.props(binaryValueStyles.inspection)}
      data-slot="binary-details"
    >
      <InputGroup
        fullWidth
        size="s"
      >
        <Input
          aria-label="Binary value"
          font="mono"
          readOnly
          value={byteCount}
        />
        {isValidByteCount === true ? (
          <Menu.Root>
            <Menu.Trigger>Copy as</Menu.Trigger>
            <Menu.Content align="end">
              <Menu.Item onClick={() => void copyAs('hex')}>Hex</Menu.Item>
              <Menu.Item onClick={() => void copyAs('base64')}>Base64</Menu.Item>
              <Menu.Separator />
              <Menu.Item onClick={() => void download()}>Download raw</Menu.Item>
            </Menu.Content>
          </Menu.Root>
        ) : null}
      </InputGroup>
      <span
        aria-live="polite"
        role="status"
        {...stylex.props(binaryValueStyles.visuallyHidden)}
      >
        {feedback}
      </span>
    </div>
  )
}

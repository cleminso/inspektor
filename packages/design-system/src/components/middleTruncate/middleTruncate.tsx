import * as stylex from '@stylexjs/stylex'

import { middleTruncateStyles } from './middleTruncate.styles'
import { splitMiddleTruncateValue } from './middleTruncateValue'

export interface MiddleTruncateProps {
  /** Complete string whose start and end remain visible when space is constrained. */
  value: string
}

export function MiddleTruncate({ value }: MiddleTruncateProps) {
  const segments = splitMiddleTruncateValue(value)

  return (
    <span
      {...stylex.props(middleTruncateStyles.root)}
      data-slot="middle-truncate"
    >
      <span
        {...stylex.props(middleTruncateStyles.preview)}
        aria-hidden="true"
        data-slot="middle-truncate-preview"
      >
        <span
          {...stylex.props(middleTruncateStyles.start)}
          data-slot="middle-truncate-start"
        >
          {segments.start}
        </span>
        <span {...stylex.props(middleTruncateStyles.endClip)}>
          <span
            {...stylex.props(middleTruncateStyles.end)}
            data-slot="middle-truncate-end"
          >
            {segments.end}
          </span>
        </span>
      </span>
      <span
        {...stylex.props(middleTruncateStyles.visuallyHidden)}
        data-slot="middle-truncate-accessible-value"
      >
        {value}
      </span>
    </span>
  )
}

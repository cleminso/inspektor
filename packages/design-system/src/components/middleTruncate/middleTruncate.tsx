import * as stylex from '@stylexjs/stylex'

import { middleTruncateStyles } from './middleTruncate.styles'

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

function splitValue(value: string): readonly [leading: string, trailing: string] {
  const graphemes = Array.from(graphemeSegmenter.segment(value), ({ segment }) => segment)
  const middleIndex = Math.ceil(graphemes.length / 2)
  return [graphemes.slice(0, middleIndex).join(''), graphemes.slice(middleIndex).join('')]
}

export interface MiddleTruncateProps {
  /** Complete string whose start and end remain visible when space is constrained. */
  value: string
}

export function MiddleTruncate({ value }: MiddleTruncateProps) {
  const [leading, trailing] = splitValue(value)

  return (
    <span
      {...stylex.props(middleTruncateStyles.root)}
      data-slot="middle-truncate"
    >
      <span
        {...stylex.props(middleTruncateStyles.leading)}
        aria-hidden="true"
        data-slot="middle-truncate-leading"
      >
        {leading}
      </span>
      <span
        {...stylex.props(middleTruncateStyles.trailingViewport)}
        aria-hidden="true"
      >
        <span
          {...stylex.props(middleTruncateStyles.trailing)}
          data-slot="middle-truncate-trailing"
        >
          {trailing}
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

// Maps CSS props to style maps.
// Does not encore design decisions
//
import * as stylex from '@stylexjs/stylex'

import { fontFamilies } from '../tokens/value.stylex'

export const textAlignStyles = stylex.create({
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  justify: { textAlign: 'justify' },
})

export const textWrapStyles = stylex.create({
  wrap: { textWrap: 'wrap' },
  nowrap: { textWrap: 'nowrap' },
  balance: { textWrap: 'balance' },
  pretty: { textWrap: 'pretty' },
})

export const textUtilityStyles = stylex.create({
  monospace: { fontFamily: fontFamilies.mono },
  tabularNums: { fontVariantNumeric: 'tabular-nums' },
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})

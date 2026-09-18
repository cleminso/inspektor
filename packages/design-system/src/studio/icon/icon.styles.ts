import * as stylex from '@stylexjs/stylex'

import { spatial } from '../../tokens/semantics.stylex'

export const iconStyles = stylex.create({
  base: {
    display: 'block',
    flexShrink: 0,
  },
  xs: {
    height: spatial['icon-size-xs'],
    width: spatial['icon-size-xs'],
  },
  s: {
    height: spatial['icon-size-s'],
    width: spatial['icon-size-s'],
  },
  m: {
    height: spatial['icon-size-m'],
    width: spatial['icon-size-m'],
  },
})

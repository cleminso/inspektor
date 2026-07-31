import * as stylex from '@stylexjs/stylex'

import { spatial } from '../../tokens/semantics.stylex'

export const copyButtonStyles = stylex.create({
  icon: {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    display: 'block',
    flexShrink: 0,
  },
  iconXS: {
    height: spatial['icon-size-xs'],
    width: spatial['icon-size-xs'],
  },
  iconS: {
    height: spatial['icon-size-s'],
    width: spatial['icon-size-s'],
  },
  iconM: {
    height: spatial['icon-size-m'],
    width: spatial['icon-size-m'],
  },
  visuallyHidden: {
    padding: 0,
    borderWidth: 0,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    position: 'absolute',
    whiteSpace: 'nowrap',
    height: 1,
    width: 1,
  },
})

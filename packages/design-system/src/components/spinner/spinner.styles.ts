import * as stylex from '@stylexjs/stylex'

import { spatial } from '../../tokens/semantics.stylex'

const reducedMotion = '@media (prefers-reduced-motion: reduce)'

const spin = stylex.keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
})

export const spinnerStyles = stylex.create({
  base: {
    animationDuration: '800ms',
    animationIterationCount: 'infinite',
    animationName: { default: spin, [reducedMotion]: 'none' },
    animationTimingFunction: 'linear',
    display: 'block',
    flexShrink: 0,
  },
  sizeS: {
    height: spatial['icon-size-xs'],
    width: spatial['icon-size-xs'],
  },
  sizeM: {
    height: spatial['icon-size-s'],
    width: spatial['icon-size-s'],
  },
  sizeL: {
    height: spatial['icon-size-m'],
    width: spatial['icon-size-m'],
  },
})

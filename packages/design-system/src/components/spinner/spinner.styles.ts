import * as stylex from '@stylexjs/stylex'

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
    height: 12,
    width: 12,
  },
  sizeM: {
    height: 14,
    width: 14,
  },
  sizeL: {
    height: 16,
    width: 16,
  },
})

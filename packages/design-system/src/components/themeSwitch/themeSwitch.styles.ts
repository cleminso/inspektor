import * as stylex from '@stylexjs/stylex'

const reducedMotion = '@media (prefers-reduced-motion: reduce)'
export const themeSwitchAnimationDurationMs = 200

const moonEnter = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(10px) rotate(-30deg)' },
  to: { opacity: 1, transform: 'translateY(0) rotate(0deg)' },
})

const moonExit = stylex.keyframes({
  from: { opacity: 1, transform: 'translateY(0) rotate(0deg)' },
  to: { opacity: 0, transform: 'translateY(-10px) rotate(30deg)' },
})

const sunEnter = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(-10px) rotate(-30deg)' },
  to: { opacity: 1, transform: 'translateY(0) rotate(0deg)' },
})

const sunExit = stylex.keyframes({
  from: { opacity: 1, transform: 'translateY(0) rotate(0deg)' },
  to: { opacity: 0, transform: 'translateY(10px) rotate(30deg)' },
})

export const themeSwitchStyles = stylex.create({
  icon: {
    alignItems: 'center',
    display: 'inline-flex',
    justifyContent: 'center',
  },
  moonEnter: {
    animationDuration: `${themeSwitchAnimationDurationMs}ms`,
    animationFillMode: 'both',
    animationName: { default: moonEnter, [reducedMotion]: 'none' },
    animationTimingFunction: 'ease-out',
  },
  moonExit: {
    animationDuration: `${themeSwitchAnimationDurationMs}ms`,
    animationFillMode: 'both',
    animationName: { default: moonExit, [reducedMotion]: 'none' },
    animationTimingFunction: 'ease-out',
  },
  sunEnter: {
    animationDuration: `${themeSwitchAnimationDurationMs}ms`,
    animationFillMode: 'both',
    animationName: { default: sunEnter, [reducedMotion]: 'none' },
    animationTimingFunction: 'ease-out',
  },
  sunExit: {
    animationDuration: `${themeSwitchAnimationDurationMs}ms`,
    animationFillMode: 'both',
    animationName: { default: sunExit, [reducedMotion]: 'none' },
    animationTimingFunction: 'ease-out',
  },
})

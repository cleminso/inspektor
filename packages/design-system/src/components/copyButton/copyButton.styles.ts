import * as stylex from '@stylexjs/stylex'

export const copyButtonStyles = stylex.create({
  icon: {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    display: 'block',
    flexShrink: 0,
  },
  iconS: {
    height: 14,
    width: 14,
  },
  iconM: {
    height: 16,
    width: 16,
  },
  iconL: {
    height: 20,
    width: 20,
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

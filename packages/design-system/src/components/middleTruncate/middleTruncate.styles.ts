import * as stylex from '@stylexjs/stylex'

export const middleTruncateStyles = stylex.create({
  root: {
    overflow: 'hidden',
    display: 'block',
    position: 'relative',
    whiteSpace: 'nowrap',
    minWidth: 0,
    width: '100%',
  },
  preview: {
    display: 'block',
  },
  measurement: {
    pointerEvents: 'none',
    position: 'absolute',
    visibility: 'hidden',
    whiteSpace: 'pre',
    width: 'max-content',
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

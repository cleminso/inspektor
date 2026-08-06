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
    display: 'flex',
    minWidth: 0,
    width: '100%',
  },
  start: {
    overflow: 'hidden',
    flexShrink: 1,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  endClip: {
    overflow: 'hidden',
    display: 'flex',
    flexShrink: 1,
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  end: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
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

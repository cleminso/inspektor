import * as stylex from '@stylexjs/stylex'

import { focusColors, textColors, surfaceColors } from '../../tokens/semantics.stylex'
import { borderRadii, fontWeights, spacing } from '../../tokens/value.stylex'
import { brandColors } from '../brandColors.stylex'

export const brandButtonLinkStyles = stylex.create({
  root: {
    borderRadius: borderRadii.s,
    paddingBlock: spacing.xs,
    paddingInline: spacing.l,
    textDecoration: 'none',
    alignItems: 'center',
    backgroundColor: {
      default: surfaceColors.inverse,
      ':hover': brandColors.actionHover,
      ':active': brandColors.actionPressed,
    },
    boxSizing: 'border-box',
    color: textColors.onInverse,
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: "'Instrument Sans Variable', sans-serif",
    fontSize: '18px',
    fontWeight: fontWeights.regular,
    justifyContent: 'center',
    lineHeight: '28px',
    outlineColor: focusColors.ring,
    outlineOffset: 2,
    outlineStyle: 'solid',
    outlineWidth: { default: 0, ':focus-visible': '2px' },
    transform: { ':active': 'scale(0.97)' },
    transitionDuration: '150ms',
    transitionProperty: 'background-color, color, transform',
    transitionTimingFunction: 'ease-out',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    height: '40px',
  },
})

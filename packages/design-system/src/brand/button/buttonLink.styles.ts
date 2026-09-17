import * as stylex from '@stylexjs/stylex'

import { focusColors, textColors, accentElementColors } from '../../tokens/semantics.stylex'
import { borderRadii, fontFamilies, fontWeights, spacing } from '../../tokens/value.stylex'

export const brandButtonLinkStyles = stylex.create({
  root: {
    borderRadius: borderRadii.s,
    paddingBlock: spacing.xs,
    paddingInline: spacing.l,
    textDecoration: 'none',
    alignItems: 'center',
    backgroundColor: {
      default: accentElementColors.default,
      ':hover': accentElementColors.hover,
      ':active': accentElementColors.pressed,
    },
    boxSizing: 'border-box',
    color: textColors.onInverse,
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: '18px',
    fontWeight: fontWeights.medium,
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

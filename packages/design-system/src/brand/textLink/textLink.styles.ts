import * as stylex from '@stylexjs/stylex'

import { focusColors, spatial, textColors } from '../../tokens/semantics.stylex'
import { borderRadii, fontWeights } from '../../tokens/value.stylex'

export const brandTextLinkStyles = stylex.create({
  root: {
    color: textColors.default,
    cursor: 'pointer',
    fontFamily: "'Instrument Sans Variable', sans-serif",
    fontSize: '18px',
    fontWeight: fontWeights.regular,
    lineHeight: '28px',
    outlineColor: focusColors.ring,
    outlineOffset: 2,
    outlineStyle: 'solid',
    outlineWidth: { default: 0, ':focus-visible': '2px' },
    textDecorationLine: { default: 'none', ':hover': 'underline' },
  },
  iconOnly: {
    borderRadius: borderRadii.xs,
    alignItems: 'center',
    display: 'inline-flex',
    justifyContent: 'center',
    height: spatial['interaction-target-min'],
    minWidth: spatial['interaction-target-min'],
  },
})

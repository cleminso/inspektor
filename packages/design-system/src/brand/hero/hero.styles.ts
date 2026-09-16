import * as stylex from '@stylexjs/stylex'

import { textColors } from '../../tokens/semantics.stylex'
import { spacing } from '../../tokens/value.stylex'
import { brandColors } from '../brandColors.stylex'
import { brandLayout } from '../page/layout.stylex'

const mediumDisplay = '@media (min-width: 900px) and (max-width: 1470px)'
const largeDisplay = '@media (min-width: 1471px)'

export const brandHeroStyles = stylex.create({
  root: {
    boxSizing: 'border-box',
    flexShrink: 0,
    width: '100%',
  },
  content: {
    gap: '18px',
    paddingBlock: brandLayout.heroPadding,
    paddingInline: spacing.xl,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  heading: {
    margin: 0,
    fontFamily: "'Instrument Sans Variable', sans-serif",
    fontWeight: 450,
    letterSpacing: '-0.02em',
    overflowWrap: 'break-word',
    textWrap: 'pretty',
  },
  title: {
    color: textColors.default,
    display: 'block',
    fontSize: {
      default: '40px',
      [largeDisplay]: '56px',
      [mediumDisplay]: '48px',
    },
    lineHeight: {
      default: '48px',
      [largeDisplay]: '56px',
      [mediumDisplay]: '48px',
    },
  },
  continuation: {
    color: textColors.muted,
    display: 'block',
    fontSize: {
      default: '36px',
      [largeDisplay]: '56px',
      [mediumDisplay]: '48px',
    },
    lineHeight: {
      default: '40px',
      [largeDisplay]: '56px',
      [mediumDisplay]: '48px',
    },
    maxWidth: {
      default: '500px',
      [largeDisplay]: 'none',
      [mediumDisplay]: 'none',
    },
  },
  description: {
    margin: 0,
    color: brandColors.description,
    fontFamily: 'system-ui, sans-serif',
    fontSize: '18px',
    letterSpacing: 0,
    lineHeight: '28px',
    textWrap: 'pretty',
    maxWidth: brandLayout.descriptionMeasure,
  },
})

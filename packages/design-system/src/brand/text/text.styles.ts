import * as stylex from '@stylexjs/stylex'

import { textColors } from '../../tokens/semantics.stylex'
import { brandColors } from '../brandColors.stylex'
import { brandLayout } from '../page/layout.stylex'

const mediumDisplay = '@media (min-width: 900px) and (max-width: 1470px)'
const largeDisplay = '@media (min-width: 1471px)'

export const brandTextStyles = stylex.create({
  root: {
    margin: 0,
    color: textColors.default,
    fontFamily: "'Instrument Sans Variable', sans-serif",
    fontWeight: 450,
    overflowWrap: 'break-word',
    textWrap: 'pretty',
  },
  pageHeading: {
    fontSize: {
      default: '40px',
      [largeDisplay]: '56px',
      [mediumDisplay]: '48px',
    },
    letterSpacing: '-0.02em',
    lineHeight: {
      default: '48px',
      [largeDisplay]: '56px',
      [mediumDisplay]: '48px',
    },
  },
  sectionHeading: {
    color: textColors.muted,
    fontSize: {
      default: '36px',
      [largeDisplay]: '56px',
    },
    letterSpacing: '-0.02em',
    lineHeight: {
      default: '48px',
      [largeDisplay]: '56px',
    },
  },
  description: {
    color: brandColors.description,
    fontSize: '18px',
    letterSpacing: 0,
    lineHeight: '28px',
    maxWidth: brandLayout.descriptionMeasure,
  },
  line: {
    display: 'block',
  },
})

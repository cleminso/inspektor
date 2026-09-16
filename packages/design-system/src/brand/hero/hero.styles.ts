import * as stylex from '@stylexjs/stylex'

import { brandLayout } from '../page/layout.stylex'

const largeDisplay = '@media (min-width: 1471px)'

export const brandHeroStyles = stylex.create({
  root: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  content: {
    width: '100%',
  },
  frame: {
    paddingBlock: {
      default: brandLayout.heroPadding,
      [largeDisplay]: brandLayout.heroPaddingLarge,
    },
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  message: {
    gap: '18px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  headings: {
    display: 'flex',
    flexDirection: 'column',
  },
})

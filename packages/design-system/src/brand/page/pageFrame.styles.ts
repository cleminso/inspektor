import * as stylex from '@stylexjs/stylex'

import { breakpointQueries } from '../../tokens/breakpoints.stylex'
import { borderRadii, spacing } from '../../tokens/value.stylex'
import { brandColors } from '../brandColors.stylex'
import { brandLayout } from './layout.stylex'

const desktop = breakpointQueries.xl

export const brandPageFrameStyles = stylex.create({
  root: {
    padding: spacing.xs,
    gap: spacing.xs,
    backgroundColor: brandColors.canvas,
    boxSizing: 'border-box',
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [desktop]: 'minmax(0, 1fr) minmax(0, 1216px) minmax(0, 1fr)',
    },
    gridTemplateRows: `${brandLayout.regionHeight} minmax(min-content, 1fr) ${brandLayout.regionHeight}`,
    minHeight: '100dvh',
    minWidth: 0,
    width: '100%',
    '::after': {
      gridColumn: '3',
      content: {
        default: 'none',
        [desktop]: "''",
      },
      gridRowEnd: '-1',
      gridRowStart: '1',
    },
    '::before': {
      gridColumn: '1',
      content: {
        default: 'none',
        [desktop]: "''",
      },
      gridRowEnd: '-1',
      gridRowStart: '1',
    },
  },
  region: {
    borderColor: brandColors.sectionBorder,
    borderRadius: borderRadii.xs,
    borderStyle: 'solid',
    borderWidth: '1px',
    gridColumn: {
      default: '1',
      [desktop]: '2',
    },
    overflow: 'hidden',
    backgroundColor: brandColors.section,
    boxSizing: 'border-box',
    minWidth: 0,
  },
  header: {
    gridRow: '1',
    paddingInline: spacing.l,
    alignItems: 'center',
    display: 'flex',
  },
  main: {
    gridRow: '2',
    minHeight: 0,
  },
  footer: {
    gridRow: '3',
  },
})

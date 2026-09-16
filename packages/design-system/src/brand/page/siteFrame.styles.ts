import * as stylex from '@stylexjs/stylex'

import { borderRadii, spacing } from '../../tokens/value.stylex'
import { brandColors } from '../brandColors.stylex'
import { brandLayout } from './layout.stylex'

const desktop = '@media (min-width: 1280px)'

export const brandSiteFrameStyles = stylex.create({
  root: {
    padding: spacing.xs,
    gap: spacing.xs,
    backgroundColor: brandColors.canvas,
    boxSizing: 'border-box',
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [desktop]: `minmax(0, 1fr) minmax(0, ${brandLayout.contentWidth}) minmax(0, 1fr)`,
    },
    minHeight: '100dvh',
    minWidth: 0,
    width: '100%',
    '::selection': {
      backgroundColor: brandColors.selectionBackground,
      color: brandColors.selectionText,
    },
  },
  rail: {
    borderRadius: borderRadii.xs,
    backgroundColor: brandColors.surface,
    display: {
      default: 'none',
      [desktop]: 'block',
    },
  },
  startRail: {
    gridColumn: '1',
  },
  endRail: {
    gridColumn: '3',
  },
  center: {
    gap: spacing.xs,
    gridColumn: {
      default: '1',
      [desktop]: '2',
    },
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0,
  },
  surface: {
    borderRadius: borderRadii.xs,
    backgroundColor: brandColors.surface,
    boxSizing: 'border-box',
    minWidth: 0,
  },
  header: {
    flexShrink: 0,
    height: brandLayout.headerHeight,
  },
  headerContent: {
    paddingInline: spacing.xl,
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    height: '100%',
    width: '100%',
  },
  main: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  footerStrip: {
    flexShrink: 0,
    height: brandLayout.footerHeight,
  },
})

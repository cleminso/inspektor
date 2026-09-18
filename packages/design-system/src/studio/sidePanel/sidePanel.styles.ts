import * as stylex from '@stylexjs/stylex'

import { borderColors, surfaceColors } from '../../tokens/semantics.stylex'
import { spacing } from '../../tokens/value.stylex'

export const sidePanelStyles = stylex.create({
  root: {
    borderColor: borderColors.subtle,
    flex: '1',
    overflow: 'hidden',
    backgroundColor: surfaceColors.background,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    width: '100%',
  },
  header: {
    padding: spacing.xs,
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    borderBottomColor: borderColors.subtle,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    minWidth: 0,
    width: '100%',
  },
  body: {
    padding: spacing.xs,
    gap: spacing.s,
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
    paddingTop: spacing.xs,
    width: '100%',
  },
  footer: {
    padding: spacing.s,
    borderColor: borderColors.subtle,
    alignItems: 'center',
    backgroundColor: surfaceColors.background,
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'space-between',
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    minWidth: 0,
    width: '100%',
  },
})

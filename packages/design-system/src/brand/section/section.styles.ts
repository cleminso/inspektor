import * as stylex from '@stylexjs/stylex'

import { spacing } from '../../tokens/value.stylex'
import { brandColors } from '../brandColors.stylex'

export const brandSectionStyles = stylex.create({
  root: {
    borderColor: brandColors.sectionBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    gap: spacing.l,
    paddingBlock: spacing.l,
    paddingInline: spacing.l,
    backgroundColor: brandColors.section,
    boxSizing: 'border-box',
    display: 'grid',
    height: '100%',
    minWidth: 0,
  },
})

import * as stylex from '@stylexjs/stylex'

import { spatial } from '../../tokens/semantics.stylex'
import {
  borderRadii,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from '../../tokens/value.stylex'
import { dataGridColors } from './dataGridColors.stylex'
import { dataGridVars } from './dataGridVars.stylex'

const reducedMotion = '@media (prefers-reduced-motion: reduce)'

const recentlyInsertedRowBar = `inset ${spatial['focus-ring-width']} 0 0 ${dataGridColors.recentlyInsertedRowBorder}`

/**
 * Holds the inserted-row tint, then releases it. The static style below keeps the tint while the
 * animation is disabled, and consumers clear the status after the animation has ended.
 */
const recentlyInsertedHighlight = stylex.keyframes({
  '0%': {
    backgroundColor: dataGridColors.recentlyInsertedRowBackground,
    boxShadow: recentlyInsertedRowBar,
  },
  '65%': {
    backgroundColor: dataGridColors.recentlyInsertedRowBackground,
    boxShadow: recentlyInsertedRowBar,
  },
  '100%': {
    backgroundColor: 'transparent',
    boxShadow: `inset ${spatial['focus-ring-width']} 0 0 transparent`,
  },
})

/**
 * Releases the applied-cell tint in one continuous motion from the moment the staged treatment is
 * withdrawn, so the staged border removal and the background drain read as a single event instead
 * of a snap followed by a later fade. The static style below keeps the tint while the animation is
 * disabled, and consumers clear the status after the animation has ended.
 */
const recentlyAppliedCellHighlight = stylex.keyframes({
  '0%': { backgroundColor: dataGridColors.recentlyAppliedCellBackground },
  '100%': { backgroundColor: 'transparent' },
})

export const dataGridStyles = stylex.create({
  root: {
    backgroundColor: dataGridColors.background,
    color: dataGridColors.text,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    width: '100%',
  },
  scrollSurface: {
    backgroundColor: dataGridColors.background,
    position: 'relative',
    minWidth: '100%',
  },
  scrollSurfacePaintBoundary: {
    contain: 'paint',
  },
  table: {
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    lineHeight: lineHeights.compact,
    tableLayout: 'fixed',
    userSelect: 'none',
  },
  visuallyHidden: {
    padding: 0,
    borderWidth: 0,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    position: 'absolute',
    whiteSpace: 'nowrap',
    height: 1,
    width: 1,
  },
  headerBackdropAnchor: {
    position: 'sticky',
    zIndex: 1,
    height: 0,
    top: 0,
  },
  headerBackdrop: {
    boxSizing: 'border-box',
    borderBottomColor: dataGridColors.headerBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    borderTopColor: dataGridColors.headerBorder,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    height: spatial['collection-row-height-xl'],
    width: '100%',
  },
  compactHeaderBackdrop: {
    height: spatial['collection-row-height-l'],
  },
  header: {
    position: 'sticky',
    zIndex: 4,
    top: 0,
  },
  headerCell: {
    overflow: 'hidden',
    backgroundColor: dataGridColors.headerBackground,
    boxSizing: 'border-box',
    color: dataGridColors.headerText,
    fontWeight: fontWeights.regular,
    position: 'sticky',
    textAlign: 'start',
    // paddingLeft: spacing.m,
    textOverflow: 'ellipsis',
    // paddingRight: spacing.m,
    whiteSpace: 'nowrap',
    zIndex: 2,
    borderBottomColor: dataGridColors.headerBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    borderRightColor: {
      default: dataGridColors.headerBorder,
      ':has([data-resizing])': dataGridColors.emphasizedColumnBorder,
      ':has([data-slot="data-grid-resize-handle"]:focus-visible)':
        dataGridColors.emphasizedColumnBorder,
      ':has([data-slot="data-grid-resize-handle"]:hover)': dataGridColors.emphasizedColumnBorder,
    },
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    borderTopColor: dataGridColors.headerBorder,
    borderTopWidth: 1,
    height: spatial['collection-row-height-xl'],
    paddingBottom: 0,
    paddingTop: 0,
    top: 0,
  },
  focusTarget: {
    outlineColor: dataGridColors.focusRing,
    outlineOffset: -2,
    outlineStyle: 'solid',
    outlineWidth: {
      default: 0,
      ':focus-visible': spatial['focus-ring-width'],
    },
  },
  activeTarget: {
    backgroundColor: dataGridColors.emphasizedHeaderBackground,
    outlineColor: {
      default: dataGridColors.emphasizedColumnBorder,
      ':focus-visible': dataGridColors.focusRing,
    },
    outlineOffset: {
      default: -1,
      ':focus-visible': -2,
    },
    outlineWidth: {
      default: 1,
      ':focus-visible': spatial['focus-ring-width'],
    },
  },
  headerCellActive: {
    color: dataGridColors.emphasizedHeaderText,
    zIndex: 3,
  },
  headerCellLayout: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  headerCellReorderable: {
    cursor: 'grab',
    touchAction: 'none',
  },
  headerCellDragging: {
    backgroundColor: dataGridColors.draggedHeaderBackground,
    cursor: 'grabbing',
    zIndex: 4,
    borderBottomColor: dataGridColors.emphasizedColumnBorder,
  },
  headerDragContent: {
    overflow: 'hidden',
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.compact,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    height: '100%',
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    width: '100%',
  },
  headerDragSource: {
    color: dataGridColors.draggedHeaderText,
  },
  headerDragSourceDragging: {
    visibility: 'hidden',
  },
  compactCellInlinePadding: {
    paddingLeft: spacing.s,
    paddingRight: spacing.s,
  },
  columnDragOverlay: {
    boxSizing: 'border-box',
    pointerEvents: 'none',
    position: 'fixed',
  },
  columnDragOverlayContent: {
    backgroundColor: dataGridColors.emphasizedHeaderBackground,
    color: dataGridColors.emphasizedHeaderText,
    borderBottomColor: dataGridColors.emphasizedColumnBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
  },
  row: {
    backgroundColor: {
      default: dataGridColors.background,
      ':hover': dataGridColors.rowHoverBackground,
    },
  },
  rowSelected: {
    backgroundColor: dataGridColors.selectedRowBackground,
  },
  rowStagedDeletion: {
    backgroundColor: {
      default: dataGridColors.stagedDeletionRowBackground,
      ':hover': dataGridColors.stagedDeletionRowBackground,
    },
    boxShadow: `inset ${spatial['focus-ring-width']} 0 0 ${dataGridColors.stagedDeletionRowBorder}`,
    textDecorationLine: 'line-through',
  },
  rowRecentlyInserted: {
    animationDuration: '1200ms',
    animationFillMode: 'forwards',
    animationName: { default: recentlyInsertedHighlight, [reducedMotion]: 'none' },
    animationTimingFunction: 'ease-in-out',
    backgroundColor: dataGridColors.recentlyInsertedRowBackground,
    boxShadow: recentlyInsertedRowBar,
  },
  cell: {
    [dataGridVars.selectedRowMarker]: '0 0 0 0 transparent',
    [dataGridVars.selectionEdgeTop]: '0 0 0 0 transparent',
    [dataGridVars.selectionEdgeRight]: '0 0 0 0 transparent',
    [dataGridVars.selectionEdgeBottom]: '0 0 0 0 transparent',
    [dataGridVars.selectionEdgeLeft]: '0 0 0 0 transparent',
    overflow: 'hidden',
    backgroundColor: dataGridColors.cellBackground,
    boxShadow: `inset ${dataGridVars.selectedRowMarker}, inset ${dataGridVars.selectionEdgeTop}, inset ${dataGridVars.selectionEdgeRight}, inset ${dataGridVars.selectionEdgeBottom}, inset ${dataGridVars.selectionEdgeLeft}`,
    boxSizing: 'border-box',
    fontFamily: fontFamilies.mono,
    whiteSpace: 'nowrap',
    borderBottomColor: dataGridColors.cellBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    borderRightColor: dataGridColors.cellBorder,
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    height: spatial['collection-row-height-xl'],
    paddingBottom: 0,
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    paddingTop: 0,
  },
  cellColumnActive: {
    backgroundColor: dataGridColors.emphasizedColumnBackground,
  },
  cellStagedUpdate: {
    backgroundColor: dataGridColors.stagedUpdateCellBackground,
    outlineColor: {
      default: dataGridColors.stagedUpdateCellBorder,
      ':focus-visible': dataGridColors.stagedUpdateCellBorder,
      '@media (forced-colors: active)': 'Highlight',
    },
  },
  cellStagedSelectionEdgeTop: {
    [dataGridVars.selectionEdgeTop]: `0 1px 0 0 ${dataGridColors.stagedUpdateCellBorder}`,
  },
  cellStagedSelectionEdgeRight: {
    [dataGridVars.selectionEdgeRight]: `-1px 0 0 0 ${dataGridColors.stagedUpdateCellBorder}`,
  },
  cellStagedSelectionEdgeBottom: {
    [dataGridVars.selectionEdgeBottom]: `0 -1px 0 0 ${dataGridColors.stagedUpdateCellBorder}`,
  },
  cellStagedSelectionEdgeLeft: {
    [dataGridVars.selectionEdgeLeft]: `1px 0 0 0 ${dataGridColors.stagedUpdateCellBorder}`,
  },
  cellRecentlyApplied: {
    animationDuration: '1200ms',
    animationFillMode: 'forwards',
    animationName: { default: recentlyAppliedCellHighlight, [reducedMotion]: 'none' },
    animationTimingFunction: 'ease-out',
    backgroundColor: dataGridColors.recentlyAppliedCellBackground,
  },
  cellSelected: {
    backgroundColor: dataGridColors.selectedCellBackground,
  },
  cellSelectedMarker: {
    [dataGridVars.selectedRowMarker]: `${spatial['focus-ring-width']} 0 0 ${dataGridColors.selectedRowBorder}`,
  },
  cellSelection: {
    backgroundColor: dataGridColors.emphasizedCellBackground,
  },
  cellSelectionEdgeTop: {
    [dataGridVars.selectionEdgeTop]: `0 1px 0 0 ${dataGridColors.emphasizedColumnBorder}`,
  },
  cellSelectionEdgeRight: {
    [dataGridVars.selectionEdgeRight]: `-1px 0 0 0 ${dataGridColors.emphasizedColumnBorder}`,
  },
  cellSelectionEdgeBottom: {
    [dataGridVars.selectionEdgeBottom]: `0 -1px 0 0 ${dataGridColors.emphasizedColumnBorder}`,
  },
  cellSelectionEdgeLeft: {
    [dataGridVars.selectionEdgeLeft]: `1px 0 0 0 ${dataGridColors.emphasizedColumnBorder}`,
  },
  cellActive: {
    backgroundColor: dataGridColors.emphasizedCellBackground,
    position: 'relative',
    zIndex: 1,
    borderBottomColor: dataGridColors.currentCellInnerBorder,
    borderRightColor: dataGridColors.currentCellInnerBorder,
  },
  cellActiveSelected: {
    position: 'relative',
    zIndex: 1,
  },
  cellDragOrigin: {
    backgroundColor: dataGridColors.emphasizedHeaderBackground,
    boxShadow: `inset 0 1px 0 ${dataGridColors.emphasizedColumnBorder}, inset -1px 0 0 ${dataGridColors.emphasizedColumnBorder}, inset 0 -1px 0 ${dataGridColors.emphasizedColumnBorder}, inset 1px 0 0 ${dataGridColors.emphasizedColumnBorder}`,
  },
  resizeHandle: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: dataGridColors.resizeHandleBackground,
    cursor: 'col-resize',
    outlineStyle: 'none',
    position: 'absolute',
    touchAction: 'none',
    zIndex: 3,
    height: '100%',
    right: 0,
    top: 0,
    width: spacing.s,
    '::after': {
      borderColor: {
        default: dataGridColors.focusRing,
        '@media (forced-colors: active)': 'Highlight',
      },
      borderRadius: borderRadii.m,
      borderStyle: {
        default: 'none',
        ':focus-visible': 'solid',
      },
      borderWidth: spatial['focus-ring-width'],
      boxSizing: 'border-box',
      content: '',
      pointerEvents: 'none',
      position: 'absolute',
      transform: 'translate(-50%, -50%)',
      height: spatial['icon-size-s'],
      left: '50%',
      top: '50%',
      width: spacing.xs,
    },
  },
  resizeHandleDragging: {
    visibility: 'hidden',
  },
  compactCell: {
    height: spatial['collection-row-height-l'],
  },
  loadingIndicator: {
    gap: spacing.s,
  },
  messageCell: {
    color: dataGridColors.messageText,
    padding: 0,
  },
  messageContent: {
    padding: spacing.xl,
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    position: 'sticky',
    textAlign: 'center',
    height: `calc(100cqh - ${spatial['collection-row-height-xl']})`,
    left: 0,
    width: '100cqw',
  },
  compactMessageContent: {
    height: `calc(100cqh - ${spatial['collection-row-height-l']})`,
  },
  virtualSpacerCell: {
    padding: 0,
    borderWidth: 0,
    height: 'inherit',
  },
  expandedCell: {
    padding: spacing.l,
    backgroundColor: dataGridColors.expandedRowBackground,
    borderBottomColor: dataGridColors.expandedRowBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
  },
  footer: {
    alignItems: 'center',
    backgroundColor: dataGridColors.footerBackground,
    color: dataGridColors.footerText,
    display: 'flex',
    flexShrink: 0,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    justifyContent: 'space-between',
    lineHeight: lineHeights.compact,
    borderTopColor: dataGridColors.footerBorder,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    minHeight: spatial['collection-row-height-xl'],
    paddingLeft: spacing.l,
    paddingRight: spacing.l,
  },
})

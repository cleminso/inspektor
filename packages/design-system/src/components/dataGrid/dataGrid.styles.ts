import * as stylex from '@stylexjs/stylex'

import { spatial } from '../../tokens/semantics.stylex'
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
} from '../../tokens/value.stylex'
import { dataGridColors } from './dataGridColors.stylex'
import { dataGridVars } from './dataGridVars.stylex'

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
    backgroundColor: dataGridColors.headerBackground,
    boxSizing: 'border-box',
    color: dataGridColors.headerText,
    borderBottomColor: dataGridColors.headerBorder,
    borderTopColor: dataGridColors.headerBorder,
    borderBottomStyle: 'solid',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    fontWeight: fontWeights.regular,
    borderRightColor: {
      default: dataGridColors.headerBorder,
      ':has([data-resizing])': dataGridColors.emphasizedColumnBorder,
      ':has([data-slot="data-grid-resize-handle"]:focus-visible)':
        dataGridColors.emphasizedColumnBorder,
      ':has([data-slot="data-grid-resize-handle"]:hover)':
        dataGridColors.emphasizedColumnBorder,
    },
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    height: spatial['collection-row-height-xl'],
    position: 'sticky',
    textAlign: 'start',
    // paddingLeft: spacing.m,
    textOverflow: 'ellipsis',
    paddingBottom: 0,
    // paddingRight: spacing.m,
    whiteSpace: 'nowrap',
    zIndex: 2,
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
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.regular,
    height: '100%',
    lineHeight: lineHeights.compact,
    overflow: 'hidden',
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
    borderBottomColor: dataGridColors.emphasizedColumnBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    color: dataGridColors.emphasizedHeaderText,
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
  rowActive: {
    boxShadow: `inset 0 ${spatial['focus-ring-width']} 0 ${dataGridColors.currentRowBorder}`,
  },
  cell: {
    [dataGridVars.selectedRowMarker]: '0 0 0 0 transparent',
    [dataGridVars.selectionEdgeTop]: '0 0 0 0 transparent',
    [dataGridVars.selectionEdgeRight]: '0 0 0 0 transparent',
    [dataGridVars.selectionEdgeBottom]: '0 0 0 0 transparent',
    [dataGridVars.selectionEdgeLeft]: '0 0 0 0 transparent',
    backgroundColor: dataGridColors.cellBackground,
    boxShadow: `inset ${dataGridVars.selectedRowMarker}, inset ${dataGridVars.selectionEdgeTop}, inset ${dataGridVars.selectionEdgeRight}, inset ${dataGridVars.selectionEdgeBottom}, inset ${dataGridVars.selectionEdgeLeft}`,
    boxSizing: 'border-box',
    fontFamily: fontFamilies.mono,
    borderBottomColor: dataGridColors.cellBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    overflow: 'hidden',
    borderRightColor: dataGridColors.cellBorder,
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    height: spatial['collection-row-height-xl'],
    paddingBottom: 0,
    whiteSpace: 'nowrap',
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
    backgroundColor: dataGridColors.resizeHandleBackground,
    borderWidth: 0,
    cursor: 'col-resize',
    height: '100%',
    outlineColor: dataGridColors.emphasizedColumnBorder,
    outlineOffset: -2,
    outlineStyle: 'solid',
    outlineWidth: {
      default: 0,
      ':focus-visible': spatial['focus-ring-width'],
    },
    padding: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    touchAction: 'none',
    width: spacing.s,
    zIndex: 3,
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
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    padding: spacing.xl,
    justifyContent: 'center',
    position: 'sticky',
    height: `calc(100cqh - ${spatial['collection-row-height-xl']})`,
    textAlign: 'center',
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
    lineHeight: lineHeights.compact,
    borderTopColor: dataGridColors.footerBorder,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    justifyContent: 'space-between',
    minHeight: spatial['collection-row-height-xl'],
    paddingLeft: spacing.l,
    paddingRight: spacing.l,
  },
})

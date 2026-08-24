import type {
  BackgroundColorToken,
  BorderColorToken,
  TextColorToken,
} from '../tokens/semantics.stylex'
import type { BorderRadiusToken, ShadowToken, SpacingToken } from '../tokens/value.stylex'
import type { BreakpointKey } from '../tokens/breakpointTypes'
import { layerIndexes } from '../tokens/layers.stylex'
import { spatial } from '../tokens/semantics.stylex'

type StyleXTokenKeys<T> = Exclude<
  keyof T,
  '__opaqueId' | '__tokens' | symbol | 'toString' | 'valueOf' | 'description'
>

type SpatialToken = StyleXTokenKeys<typeof spatial>
type LayerIndex = keyof typeof layerIndexes

export type PseudoState = 'hover' | 'focus' | 'active' | 'focusVisible' | 'focusWithin'

export type ResponsiveValue<T> = T | Partial<Record<'base' | BreakpointKey | PseudoState, T>>

interface SpacingProps {
  padding?: ResponsiveValue<SpacingToken>
  paddingTop?: ResponsiveValue<SpacingToken>
  paddingRight?: ResponsiveValue<SpacingToken>
  paddingBottom?: ResponsiveValue<SpacingToken>
  paddingLeft?: ResponsiveValue<SpacingToken>
  paddingHorizontal?: ResponsiveValue<SpacingToken>
  paddingVertical?: ResponsiveValue<SpacingToken>
  p?: ResponsiveValue<SpacingToken>
  pt?: ResponsiveValue<SpacingToken>
  pr?: ResponsiveValue<SpacingToken>
  pb?: ResponsiveValue<SpacingToken>
  pl?: ResponsiveValue<SpacingToken>
  px?: ResponsiveValue<SpacingToken>
  py?: ResponsiveValue<SpacingToken>

  margin?: ResponsiveValue<SpacingToken | 'auto'>
  marginTop?: ResponsiveValue<SpacingToken | 'auto'>
  marginRight?: ResponsiveValue<SpacingToken | 'auto'>
  marginBottom?: ResponsiveValue<SpacingToken | 'auto'>
  marginLeft?: ResponsiveValue<SpacingToken | 'auto'>
  marginHorizontal?: ResponsiveValue<SpacingToken | 'auto'>
  marginVertical?: ResponsiveValue<SpacingToken | 'auto'>
  m?: ResponsiveValue<SpacingToken | 'auto'>
  mt?: ResponsiveValue<SpacingToken | 'auto'>
  mr?: ResponsiveValue<SpacingToken | 'auto'>
  mb?: ResponsiveValue<SpacingToken | 'auto'>
  ml?: ResponsiveValue<SpacingToken | 'auto'>
  mx?: ResponsiveValue<SpacingToken | 'auto'>
  my?: ResponsiveValue<SpacingToken | 'auto'>

  gap?: ResponsiveValue<SpacingToken>
  rowGap?: ResponsiveValue<SpacingToken>
  columnGap?: ResponsiveValue<SpacingToken>
  g?: ResponsiveValue<SpacingToken>
}

interface ColorProps {
  backgroundColor?: ResponsiveValue<BackgroundColorToken>
  color?: ResponsiveValue<TextColorToken>
  borderColor?: ResponsiveValue<BorderColorToken>
}

interface BorderProps {
  borderRadius?: ResponsiveValue<BorderRadiusToken>
  borderTopLeftRadius?: ResponsiveValue<BorderRadiusToken>
  borderTopRightRadius?: ResponsiveValue<BorderRadiusToken>
  borderBottomLeftRadius?: ResponsiveValue<BorderRadiusToken>
  borderBottomRightRadius?: ResponsiveValue<BorderRadiusToken>
  borderWidth?: ResponsiveValue<0 | 1>
  borderTopWidth?: ResponsiveValue<0 | 1>
  borderRightWidth?: ResponsiveValue<0 | 1>
  borderBottomWidth?: ResponsiveValue<0 | 1>
  borderLeftWidth?: ResponsiveValue<0 | 1>
  borderStyle?: ResponsiveValue<'solid' | 'dashed' | 'dotted' | 'none'>
}

interface ShadowProps {
  boxShadow?: ResponsiveValue<ShadowToken>
}

interface LayoutProps {
  display?: ResponsiveValue<
    | 'flex'
    | 'grid'
    | 'block'
    | 'inline'
    | 'inline-flex'
    | 'inline-grid'
    | 'inline-block'
    | 'none'
    | 'contents'
  >
  overflow?: ResponsiveValue<'hidden' | 'auto' | 'scroll' | 'visible'>
  overflowX?: ResponsiveValue<'hidden' | 'auto' | 'scroll' | 'visible'>
  overflowY?: ResponsiveValue<'hidden' | 'auto' | 'scroll' | 'visible'>
  width?: ResponsiveValue<SpatialToken | 'full'>
  height?: ResponsiveValue<SpatialToken | 'full'>
  minWidth?: ResponsiveValue<0 | SpatialToken | 'full'>
  maxWidth?: ResponsiveValue<SpatialToken | 'full'>
  minHeight?: ResponsiveValue<0 | SpatialToken | 'full'>
  maxHeight?: ResponsiveValue<SpatialToken | 'full'>
  aspectRatio?: ResponsiveValue<'square' | 'landscape' | 'portrait' | 'video'>
}

interface FlexProps {
  flex?: ResponsiveValue<0 | 1 | 'none'>
  flexDirection?: ResponsiveValue<'row' | 'column' | 'row-reverse' | 'column-reverse'>
  flexWrap?: ResponsiveValue<'wrap' | 'nowrap' | 'wrap-reverse'>
  flexGrow?: ResponsiveValue<0 | 1>
  flexShrink?: ResponsiveValue<0 | 1>
  flexBasis?: ResponsiveValue<0 | 'auto'>
  alignItems?: ResponsiveValue<'start' | 'end' | 'center' | 'baseline' | 'stretch'>
  alignSelf?: ResponsiveValue<'start' | 'end' | 'center' | 'baseline' | 'stretch' | 'auto'>
  justifyContent?: ResponsiveValue<'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'>
  alignContent?: ResponsiveValue<
    'start' | 'end' | 'center' | 'between' | 'around' | 'evenly' | 'stretch'
  >
}

interface GridProps {
  gridTemplateColumns?: ResponsiveValue<
    'one' | 'two' | 'three' | 'four' | 'three-one' | 'auto-fit-s' | 'auto-fit-m' | 'label-content'
  >
  gridTemplateRows?: ResponsiveValue<'one' | 'two' | 'three' | 'four'>
  gridColumn?: ResponsiveValue<'auto' | 'span-1' | 'span-2' | 'span-3' | 'span-4' | 'full'>
  gridRow?: ResponsiveValue<'auto' | 'span-1' | 'span-2' | 'span-3' | 'span-4' | 'full'>
  gridAutoFlow?: ResponsiveValue<'row' | 'column' | 'dense' | 'row-dense' | 'column-dense'>
}

interface PositionProps {
  position?: ResponsiveValue<'relative' | 'absolute' | 'fixed' | 'sticky' | 'static'>
  top?: ResponsiveValue<SpacingToken>
  right?: ResponsiveValue<SpacingToken>
  bottom?: ResponsiveValue<SpacingToken>
  left?: ResponsiveValue<SpacingToken>
  inset?: ResponsiveValue<SpacingToken>
  zIndex?: ResponsiveValue<LayerIndex>
}

interface VisualProps {
  opacity?: ResponsiveValue<0 | 1>
  cursor?: ResponsiveValue<
    'pointer' | 'default' | 'not-allowed' | 'grab' | 'grabbing' | 'text' | 'move' | 'wait'
  >
  pointerEvents?: ResponsiveValue<'none' | 'auto'>
  visibility?: ResponsiveValue<'visible' | 'hidden'>
  userSelect?: ResponsiveValue<'none' | 'text' | 'all' | 'auto'>
  textAlign?: ResponsiveValue<'left' | 'center' | 'right' | 'justify'>
}

export type BoxStyleProps = SpacingProps &
  ColorProps &
  BorderProps &
  ShadowProps &
  LayoutProps &
  FlexProps &
  GridProps &
  PositionProps &
  VisualProps

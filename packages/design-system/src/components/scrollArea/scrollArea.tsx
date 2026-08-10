import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area'
import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ForwardedRef } from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { scrollbarStyles } from '../../styles/scrollbar.styles'
import { scrollAreaStyles } from './scrollArea.styles'

export type ScrollAreaAxis = 'none' | 'vertical' | 'both'

export interface ScrollAreaProps extends Omit<
  BaseScrollArea.Viewport.Props,
  'className' | 'render' | 'style'
> {
  /** Controls which native scroll axes and overlay tracks are available. */
  axis?: ScrollAreaAxis
}

type VerticalTrackOffset = 'control-height-m' | 'control-height-l'

interface ScrollAreaPrivateProps extends ScrollAreaProps {
  layout?: 'fill' | 'content'
  maxHeight?: 's' | 'm' | 'l'
  rootSlot?: string
  scrollRendering?: 'default' | 'frequent'
  verticalTrackOffset?: VerticalTrackOffset
  viewportContainerType?: 'size'
  viewportSlot?: string
}

const verticalTrackOffsetStyles = {
  'control-height-m': scrollAreaStyles.verticalTrackOffsetM,
  'control-height-l': scrollAreaStyles.verticalTrackOffsetL,
} satisfies Record<VerticalTrackOffset, stylex.StyleXStyles>

const maxHeightStyles = {
  s: scrollAreaStyles.maxHeightS,
  m: scrollAreaStyles.maxHeightM,
  l: scrollAreaStyles.maxHeightL,
} satisfies Record<NonNullable<ScrollAreaPrivateProps['maxHeight']>, stylex.StyleXStyles>

function setForwardedRef(ref: ForwardedRef<HTMLDivElement>, node: HTMLDivElement | null): void {
  if (typeof ref === 'function') {
    ref(node)
  } else if (ref !== null) {
    ref.current = node
  }
}

function renderScrollArea(
  {
    axis = 'vertical',
    children,
    layout = 'fill',
    maxHeight,
    rootSlot = 'scroll-area',
    scrollRendering = 'default',
    verticalTrackOffset,
    viewportContainerType,
    viewportSlot = 'scroll-area-viewport',
    ...props
  }: ScrollAreaPrivateProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const rootStyleProps = stylex.props(
    scrollAreaStyles.root,
    layout === 'content' && scrollAreaStyles.rootContent,
    maxHeight !== undefined && maxHeightStyles[maxHeight],
  )
  const viewportStyleProps = stylex.props(
    scrollAreaStyles.viewport,
    layout === 'content' && scrollAreaStyles.viewportContent,
    scrollbarStyles.hidden,
    scrollRendering === 'frequent' && scrollAreaStyles.viewportFrequentScroll,
    viewportContainerType === 'size' && scrollAreaStyles.viewportSizeContainer,
    axis === 'none' && scrollAreaStyles.viewportNone,
    axis === 'vertical' && scrollAreaStyles.viewportVertical,
    axis === 'both' && scrollAreaStyles.viewportBoth,
  )
  const contentStyleProps = stylex.props(
    scrollAreaStyles.content,
    axis === 'vertical' && scrollAreaStyles.contentVertical,
  )
  const viewportBehaviorStyle =
    axis === 'none'
      ? { overflow: 'hidden' as const }
      : axis === 'vertical'
        ? { overflowX: 'hidden' as const, overflowY: 'scroll' as const }
        : undefined
  const scrollbarStateStyleProps = createStateStyleProps<BaseScrollArea.Scrollbar.State>(
    (state) => {
      const hasOverflow = state.orientation === 'vertical' ? state.hasOverflowY : state.hasOverflowX

      return [
        scrollAreaStyles.scrollbar,
        state.orientation === 'vertical'
          ? scrollAreaStyles.scrollbarVertical
          : scrollAreaStyles.scrollbarHorizontal,
        state.orientation === 'vertical' &&
          verticalTrackOffset !== undefined &&
          verticalTrackOffsetStyles[verticalTrackOffset],
        state.orientation === 'vertical' &&
          verticalTrackOffset !== undefined &&
          scrollAreaStyles.verticalTrackFlushEnd,
        hasOverflow === true && scrollAreaStyles.scrollbarWithOverflow,
        hasOverflow === true &&
          (state.hovering === true || state.scrolling === true) &&
          scrollAreaStyles.scrollbarInteractive,
        state.scrolling === true && scrollAreaStyles.scrollbarScrolling,
      ]
    },
  )
  const setViewportRef = (node: HTMLDivElement | null) => {
    if (node !== null && typeof node.getAnimations !== 'function') {
      Object.defineProperty(node, 'getAnimations', {
        configurable: true,
        value: () => [],
      })
    }
    setForwardedRef(forwardedRef, node)
  }

  return (
    <BaseScrollArea.Root
      {...rootStyleProps}
      data-axis={axis}
      data-scrollbar="overlay"
      data-layout={layout}
      data-slot={rootSlot}
    >
      <BaseScrollArea.Viewport
        {...props}
        ref={setViewportRef}
        {...viewportStyleProps}
        style={{ ...viewportStyleProps.style, ...viewportBehaviorStyle }}
        data-axis={axis}
        data-container-type={viewportContainerType}
        data-scrollbar="hidden"
        data-slot={viewportSlot}
      >
        <BaseScrollArea.Content
          {...contentStyleProps}
          style={{
            ...contentStyleProps.style,
            minWidth: axis === 'both' ? 'fit-content' : 0,
          }}
          data-slot="scroll-area-content"
        >
          {children}
        </BaseScrollArea.Content>
      </BaseScrollArea.Viewport>

      {axis === 'none' ? null : (
        <BaseScrollArea.Scrollbar
          keepMounted
          orientation="vertical"
          {...scrollbarStateStyleProps}
          data-placement={verticalTrackOffset === undefined ? 'viewport' : 'body'}
          data-slot="scroll-area-scrollbar"
        >
          <BaseScrollArea.Thumb
            {...stylex.props(scrollAreaStyles.thumb, scrollAreaStyles.thumbVertical)}
            data-slot="scroll-area-thumb"
          />
        </BaseScrollArea.Scrollbar>
      )}

      {axis === 'both' ? (
        <>
          <BaseScrollArea.Scrollbar
            keepMounted
            orientation="horizontal"
            {...scrollbarStateStyleProps}
            data-placement="viewport"
            data-slot="scroll-area-scrollbar"
          >
            <BaseScrollArea.Thumb
              {...stylex.props(scrollAreaStyles.thumb, scrollAreaStyles.thumbHorizontal)}
              data-slot="scroll-area-thumb"
            />
          </BaseScrollArea.Scrollbar>
          <BaseScrollArea.Corner
            {...stylex.props(scrollAreaStyles.corner)}
            data-slot="scroll-area-corner"
          />
        </>
      ) : null}
    </BaseScrollArea.Root>
  )
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { axis = 'vertical', ...props },
  forwardedRef,
) {
  return renderScrollArea({ ...props, axis }, forwardedRef)
})

export const ScrollAreaPrivate = forwardRef<HTMLDivElement, ScrollAreaPrivateProps>(
  function ScrollAreaPrivate({ axis = 'vertical', ...props }, forwardedRef) {
    return renderScrollArea({ ...props, axis }, forwardedRef)
  },
)

import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import {
  createContext,
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { ScrollAreaPrivate } from '../scrollArea/scrollArea'
import { treeStyles } from './tree.styles'

type WithoutStyles<Props> = Omit<Props, 'className' | 'style' | 'render'>
type CurrentItemRegistration = (item: HTMLLIElement | null) => void

const CurrentItemContext = createContext<CurrentItemRegistration | null>(null)

export interface TreeRootProps extends Omit<
  ComponentPropsWithoutRef<'nav'>,
  'aria-label' | 'className' | 'style'
> {
  /** Identifies the navigation tree for assistive technology. */
  'aria-label': string
}

export interface TreeSectionProps extends WithoutStyles<BaseCollapsible.Root.Props> {
  /** Whether the section is initially expanded. */
  defaultOpen?: BaseCollapsible.Root.Props['defaultOpen']
  /** Whether the section is expanded when controlled. */
  open?: BaseCollapsible.Root.Props['open']
  /** Runs when the section expands or collapses. */
  onOpenChange?: BaseCollapsible.Root.Props['onOpenChange']
  /** Disables the section and its trigger. */
  disabled?: BaseCollapsible.Root.Props['disabled']
}

export interface TreeTriggerProps extends Omit<
  WithoutStyles<BaseCollapsible.Trigger.Props>,
  'disabled' | 'nativeButton'
> {
  /** Visible name of the expandable section. */
  children: ReactNode
}

export interface TreeContentProps extends WithoutStyles<BaseCollapsible.Panel.Props> {
  /** Keeps the section content mounted while collapsed. */
  keepMounted?: BaseCollapsible.Panel.Props['keepMounted']
  /** Allows browser find-in-page to reveal collapsed content. */
  hiddenUntilFound?: BaseCollapsible.Panel.Props['hiddenUntilFound']
}

export interface TreeItemProps extends Omit<
  useRender.ComponentProps<'a'>,
  'className' | 'color' | 'ref' | 'style'
> {
  /** Identifies the native anchor destination when render composition is not used. */
  href?: useRender.ComponentProps<'a'>['href']
  /** Composes the navigation item onto a router link component. */
  render?: useRender.ComponentProps<'a'>['render']
  /** Marks this item as the current page. */
  'aria-current'?: 'page'
}

function TreeRoot({ children, ...props }: TreeRootProps) {
  const domProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => key !== 'className' && key !== 'style'),
  ) as ComponentPropsWithoutRef<'nav'>

  return (
    <ScrollAreaPrivate
      rootSlot="tree-scroll-area"
      viewportFocus="descendants"
      viewportSlot="tree-scroll-area-viewport"
    >
      <nav
        {...domProps}
        {...stylex.props(treeStyles.root)}
        data-slot="tree-root"
      >
        <ul {...stylex.props(treeStyles.list)}>{children}</ul>
      </nav>
    </ScrollAreaPrivate>
  )
}

const TreeSection = forwardRef<HTMLDivElement, TreeSectionProps>(function TreeSection(
  { defaultOpen = false, disabled = false, ...props },
  forwardedRef,
) {
  const stateStyles = createStateStyleProps<BaseCollapsible.Root.State>((state) => [
    treeStyles.section,
    state.open === true && treeStyles.sectionOpen,
    state.open === false && treeStyles.sectionClosed,
    state.disabled === true && treeStyles.sectionDisabled,
    state.transitionStatus === 'starting' && treeStyles.sectionStarting,
    state.transitionStatus === 'ending' && treeStyles.sectionEnding,
  ])

  return (
    <li {...stylex.props(treeStyles.sectionItem)}>
      <BaseCollapsible.Root
        {...props}
        ref={forwardedRef}
        defaultOpen={defaultOpen}
        disabled={disabled}
        {...stateStyles}
        data-slot="tree-section"
      />
    </li>
  )
})

const TreeTrigger = forwardRef<HTMLButtonElement, TreeTriggerProps>(function TreeTrigger(
  { children, ...props },
  forwardedRef,
) {
  const stateStyles = createStateStyleProps<BaseCollapsible.Trigger.State>((state) => [
    treeStyles.trigger,
    state.open === true && treeStyles.triggerOpen,
    state.open === false && treeStyles.triggerClosed,
    state.disabled === true && treeStyles.triggerDisabled,
    state.transitionStatus === 'starting' && treeStyles.triggerStarting,
    state.transitionStatus === 'ending' && treeStyles.triggerEnding,
  ])

  return (
    <BaseCollapsible.Trigger
      {...props}
      ref={forwardedRef}
      nativeButton
      {...stateStyles}
      data-slot="tree-trigger"
    >
      <span {...stylex.props(treeStyles.label)}>{children}</span>
    </BaseCollapsible.Trigger>
  )
})

const TreeContent = forwardRef<HTMLDivElement, TreeContentProps>(function TreeContent(
  { children, hiddenUntilFound = false, keepMounted = false, ...props },
  forwardedRef,
) {
  const [indicatorTop, setIndicatorTop] = useState<number | null>(null)
  const currentItemRef = useRef<HTMLLIElement>(null)
  const observerRef = useRef<ResizeObserver>(null)
  const updateIndicator = useCallback(() => {
    setIndicatorTop(currentItemRef.current?.offsetTop ?? null)
  }, [])
  const registerCurrentItem = useCallback<CurrentItemRegistration>(
    (item) => {
      currentItemRef.current = item
      updateIndicator()
    },
    [updateIndicator],
  )
  const registerBranch = useCallback(
    (branch: HTMLUListElement | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null

      if (branch !== null) {
        observerRef.current = new ResizeObserver(updateIndicator)
        observerRef.current.observe(branch)
      }
    },
    [updateIndicator],
  )

  const stateStyles = createStateStyleProps<BaseCollapsible.Panel.State>((state) => [
    treeStyles.content,
    state.open === true && treeStyles.contentOpen,
    state.open === false && treeStyles.contentClosed,
    state.disabled === true && treeStyles.contentDisabled,
    state.transitionStatus === 'starting' && treeStyles.contentStarting,
    state.transitionStatus === 'ending' && treeStyles.contentEnding,
  ])

  return (
    <BaseCollapsible.Panel
      {...props}
      ref={forwardedRef}
      hiddenUntilFound={hiddenUntilFound}
      keepMounted={keepMounted}
      {...stateStyles}
      data-slot="tree-content"
    >
      <CurrentItemContext.Provider value={registerCurrentItem}>
        <ul
          ref={registerBranch}
          {...stylex.props(treeStyles.branch)}
        >
          {indicatorTop === null ? null : (
            <li
              aria-hidden="true"
              {...stylex.props(treeStyles.itemIndicator)}
              data-slot="tree-current-indicator"
              style={{ transform: `translateY(${indicatorTop}px)` }}
            />
          )}
          {children}
        </ul>
      </CurrentItemContext.Provider>
    </BaseCollapsible.Panel>
  )
})

const TreeItem = forwardRef<HTMLAnchorElement, TreeItemProps>(function TreeItem(
  { children, render, ...props },
  forwardedRef,
) {
  const isCurrent = props['aria-current'] === 'page'
  const registerCurrentItem = useContext(CurrentItemContext)
  const defaultProps = {
    ...stylex.props(treeStyles.itemLink, isCurrent === true && treeStyles.itemLinkCurrent),
    children: <span {...stylex.props(treeStyles.label)}>{children}</span>,
    'data-slot': 'tree-item-link',
  } as useRender.ElementProps<'a'>
  const link = useRender({
    defaultTagName: 'a',
    render,
    ref: forwardedRef,
    props: mergeProps<'a'>(defaultProps, props),
  })

  return (
    <li
      ref={isCurrent === true ? registerCurrentItem : undefined}
      {...stylex.props(treeStyles.item)}
      data-slot="tree-item"
    >
      {link}
    </li>
  )
})

export const Tree = Object.assign(TreeRoot, {
  Root: TreeRoot,
  Section: TreeSection,
  Trigger: TreeTrigger,
  Content: TreeContent,
  Item: TreeItem,
})

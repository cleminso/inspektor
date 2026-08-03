import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithRef } from 'react'

import { sidePanelStyles } from './sidePanel.styles'

export type SidePanelRootProps = Omit<ComponentPropsWithRef<'aside'>, 'className' | 'style'>
export type SidePanelHeaderProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'style'>
export type SidePanelBodyProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'style'>
export type SidePanelFooterProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'style'>

const SidePanelRoot = forwardRef<HTMLElement, SidePanelRootProps>(
  function SidePanelRoot(props, ref) {
    return (
      <aside {...props} ref={ref} {...stylex.props(sidePanelStyles.root)} data-slot="side-panel" />
    )
  },
)

const SidePanelHeader = forwardRef<HTMLDivElement, SidePanelHeaderProps>(
  function SidePanelHeader(props, ref) {
    return (
      <div
        {...props}
        ref={ref}
        {...stylex.props(sidePanelStyles.header)}
        data-slot="side-panel-header"
      />
    )
  },
)

const SidePanelBody = forwardRef<HTMLDivElement, SidePanelBodyProps>(
  function SidePanelBody(props, ref) {
    return (
      <div
        {...props}
        ref={ref}
        {...stylex.props(sidePanelStyles.body)}
        data-slot="side-panel-body"
      />
    )
  },
)

const SidePanelFooter = forwardRef<HTMLDivElement, SidePanelFooterProps>(
  function SidePanelFooter(props, ref) {
    return (
      <div
        {...props}
        ref={ref}
        {...stylex.props(sidePanelStyles.footer)}
        data-slot="side-panel-footer"
      />
    )
  },
)

export const SidePanel = Object.assign(SidePanelRoot, {
  Root: SidePanelRoot,
  Body: SidePanelBody,
  Footer: SidePanelFooter,
  Header: SidePanelHeader,
})

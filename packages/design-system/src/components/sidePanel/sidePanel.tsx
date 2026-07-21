import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { sidePanelStyles } from './sidePanel.styles'

interface SidePanelPartProps {
  /** Content rendered in this panel region. */
  children?: ReactNode
}

export type SidePanelRootProps = SidePanelPartProps
export type SidePanelHeaderProps = SidePanelPartProps
export type SidePanelBodyProps = SidePanelPartProps
export type SidePanelFooterProps = SidePanelPartProps

function SidePanelRoot({ children }: SidePanelRootProps) {
  return (
    <aside {...stylex.props(sidePanelStyles.root)} data-slot="side-panel">
      {children}
    </aside>
  )
}

function SidePanelHeader({ children }: SidePanelHeaderProps) {
  return (
    <div {...stylex.props(sidePanelStyles.header)} data-slot="side-panel-header">
      {children}
    </div>
  )
}

function SidePanelBody({ children }: SidePanelBodyProps) {
  return (
    <div {...stylex.props(sidePanelStyles.body)} data-slot="side-panel-body">
      {children}
    </div>
  )
}

function SidePanelFooter({ children }: SidePanelFooterProps) {
  return (
    <div {...stylex.props(sidePanelStyles.footer)} data-slot="side-panel-footer">
      {children}
    </div>
  )
}

export const SidePanel = Object.assign(SidePanelRoot, {
  Root: SidePanelRoot,
  Body: SidePanelBody,
  Footer: SidePanelFooter,
  Header: SidePanelHeader,
})

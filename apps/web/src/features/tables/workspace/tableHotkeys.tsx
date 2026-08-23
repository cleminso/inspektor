import { useHotkey } from '@tanstack/react-hotkeys'
import { useMemo } from 'react'

import {
  isAppHotkeyInteractionLayer,
  useAppCommands,
  type AppCommand,
} from '@app/hotkeys/appHotkeys'
import { appHotkeys } from '@app/hotkeys/hotkeyCatalog'
import { useSidePanelLayout } from '@tables/tableList/layout'
import { useTableNavigationControls } from '@tables/workspace/navigationHistory'
import { useTableTabs } from '@tables/workspace/tabsProvider'

const workspaceHotkeyOptions = {
  ignoreInputs: true,
  preventDefault: false,
  stopPropagation: false,
} as const

/** Runs a one-shot workspace command only when no focused interaction owns the keyboard event. */
function runWorkspaceHotkey(event: KeyboardEvent, command: () => void): void {
  if (
    event.defaultPrevented === true ||
    event.isComposing === true ||
    event.repeat === true ||
    isAppHotkeyInteractionLayer(event.target)
  ) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  command()
}

export function TableHotkeys(): null {
  const { toggle } = useSidePanelLayout()
  const { activeTabId, closeTab, openNewView, tabs } = useTableTabs()
  const { canGoBack, canGoForward, goBack, goForward } = useTableNavigationControls()
  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const canCloseActiveTab =
    activeTab !== undefined && (activeTab.kind !== 'newView' || tabs.length > 1)

  useHotkey(
    appHotkeys.toggleTableNavigator,
    (event) => runWorkspaceHotkey(event, toggle),
    workspaceHotkeyOptions,
  )
  useHotkey(
    appHotkeys.openTableView,
    (event) => runWorkspaceHotkey(event, openNewView),
    workspaceHotkeyOptions,
  )
  useHotkey(
    appHotkeys.closeTableView,
    (event) => {
      runWorkspaceHotkey(event, () => {
        if (canCloseActiveTab === true && activeTabId !== null) {
          closeTab(activeTabId)
        }
      })
    },
    workspaceHotkeyOptions,
  )
  useHotkey(
    appHotkeys.goBack,
    (event) => {
      runWorkspaceHotkey(event, () => {
        if (canGoBack === true) {
          goBack()
        }
      })
    },
    workspaceHotkeyOptions,
  )
  useHotkey(
    appHotkeys.goForward,
    (event) => {
      runWorkspaceHotkey(event, () => {
        if (canGoForward === true) {
          goForward()
        }
      })
    },
    workspaceHotkeyOptions,
  )

  const commands = useMemo<readonly AppCommand[]>(
    () => [
      {
        id: 'tables.openView',
        label: 'Open new table view',
        hotkey: appHotkeys.openTableView,
        perform: openNewView,
      },
      {
        id: 'tables.closeView',
        label: 'Close current view',
        disabled: canCloseActiveTab === false,
        hotkey: appHotkeys.closeTableView,
        perform: () => {
          if (activeTabId !== null) {
            closeTab(activeTabId)
          }
        },
      },
    ],
    [activeTabId, canCloseActiveTab, closeTab, openNewView],
  )
  useAppCommands(commands)

  return null
}

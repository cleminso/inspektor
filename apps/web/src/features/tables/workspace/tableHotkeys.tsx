import { useHotkey } from '@tanstack/react-hotkeys'
import { useMemo } from 'react'

import {
  appHotkeyOptions,
  runAppHotkey,
  useAppCommands,
  type AppCommand,
} from '@app/hotkeys/appHotkeys'
import { appHotkeys } from '@app/hotkeys/hotkeyCatalog'
import { useTableNavigationControls } from '@tables/workspace/navigationHistory'
import { useTableTabs } from '@tables/workspace/tabsProvider'
import { TableCommands } from '@tables/workspace/tableCommands'

export function TableHotkeys(): React.ReactElement {
  const { activeTabId, closeTab, openNewView, tabs } = useTableTabs()
  const { canGoBack, canGoForward, goBack, goForward } = useTableNavigationControls()
  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const canCloseActiveTab =
    activeTab !== undefined && (activeTab.kind !== 'newView' || tabs.length > 1)

  useHotkey(appHotkeys.openTableView, (event) => runAppHotkey(event, openNewView), appHotkeyOptions)
  useHotkey(
    appHotkeys.closeTableView,
    (event) => {
      runAppHotkey(event, () => {
        if (canCloseActiveTab === true && activeTabId !== null) {
          closeTab(activeTabId)
        }
      })
    },
    appHotkeyOptions,
  )
  useHotkey(
    appHotkeys.goBack,
    (event) => {
      runAppHotkey(event, () => {
        if (canGoBack === true) {
          goBack()
        }
      })
    },
    appHotkeyOptions,
  )
  useHotkey(
    appHotkeys.goForward,
    (event) => {
      runAppHotkey(event, () => {
        if (canGoForward === true) {
          goForward()
        }
      })
    },
    appHotkeyOptions,
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

  return <TableCommands tabs={tabs} />
}

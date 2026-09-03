import type { Hotkey } from '@tanstack/react-hotkeys'

/**
 * Canonical application shortcuts shared by handlers and visible shortcut hints.
 * Keep a shortcut here instead of duplicating its string at each call site.
 */
export const appHotkeys = {
  closeTableView: 'Alt+W',
  copyCell: 'Mod+C',
  goBack: 'Alt+[',
  goForward: 'Alt+]',
  insertRow: 'Alt+I',
  moveTableColumnLeft: 'Shift+ArrowLeft',
  moveTableColumnRight: 'Shift+ArrowRight',
  nextTablePage: 'Mod+ArrowRight',
  openCommandPalette: 'Mod+K',
  openLiveQueriesDock: 'Alt+Q',
  openTablesDock: 'Alt+T',
  openTableView: 'Alt+N',
  previousTablePage: 'Mod+ArrowLeft',
  toggleLeftDock: 'Mod+B',
} as const satisfies Record<string, Hotkey>

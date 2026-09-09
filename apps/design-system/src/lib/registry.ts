export interface SourceReference {
  label: string
  path: string
}

export interface NavItem {
  title: string
  slug: string
  href: string
  description: string
  source: SourceReference
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const colorsFoundationItem = {
  title: 'Colors',
  slug: 'colors',
  href: '/foundations/colors',
  description: 'Learn how to work with our color system. Click to copy raw values.',
  source: {
    label: 'value.stylex.ts',
    path: 'packages/design-system/src/tokens/value.stylex.ts',
  },
} satisfies NavItem

export const typographyFoundationItem = {
  title: 'Typography',
  slug: 'typography',
  href: '/foundations/typography',
  description: 'Text scale, tone, and hierarchy for inspektor surfaces.',
  source: {
    label: 'semantics.stylex.ts',
    path: 'packages/design-system/src/tokens/semantics.stylex.ts',
  },
} satisfies NavItem

const foundationItems: NavItem[] = [colorsFoundationItem, typographyFoundationItem]

export const buttonItem = {
  title: 'Button',
  slug: 'button',
  href: '/components/button',
  description:
    'Labelled and icon-only actions with variants, sizes, loading, and composition support.',
  source: {
    label: 'button.tsx',
    path: 'packages/design-system/src/components/button/button.tsx',
  },
} satisfies NavItem

export const badgeItem = {
  title: 'Badge',
  slug: 'badge',
  href: '/components/badge',
  description: 'Compact text metadata for statuses and categories.',
  source: {
    label: 'badge.tsx',
    path: 'packages/design-system/src/components/badge/badge.tsx',
  },
} satisfies NavItem

export const alertDialogItem = {
  title: 'Alert Dialog',
  slug: 'alert-dialog',
  href: '/components/alert-dialog',
  description: 'Modal confirmation that requires an explicit response before proceeding.',
  source: {
    label: 'alertDialog.tsx',
    path: 'packages/design-system/src/components/alertDialog/alertDialog.tsx',
  },
} satisfies NavItem

export const commandItem = {
  title: 'Command',
  slug: 'command',
  href: '/components/command',
  description: 'Composable searchable command surfaces with optional modal containment.',
  source: {
    label: 'command.tsx',
    path: 'packages/design-system/src/components/command/command.tsx',
  },
} satisfies NavItem

export const dataGridFilterClauseItem = {
  title: 'Data Grid Filter Clause',
  slug: 'data-grid-filter-clause',
  href: '/components/data-grid-filter-clause',
  description: 'Segmented column, operator, value, and removal controls for applied filters.',
  source: {
    label: 'dataGridFilterClause.tsx',
    path: 'packages/design-system/src/components/dataGridFilterClause/dataGridFilterClause.tsx',
  },
} satisfies NavItem

export const buttonLinkItem = {
  title: 'Button Link',
  slug: 'button-link',
  href: '/components/button-link',
  description: 'Navigation with Button presentation and native link semantics.',
  source: {
    label: 'buttonLink.tsx',
    path: 'packages/design-system/src/components/buttonLink/buttonLink.tsx',
  },
} satisfies NavItem

export const textLinkItem = {
  title: 'Text Link',
  slug: 'text-link',
  href: '/components/text-link',
  description: 'Inline navigation with native anchor semantics and router composition.',
  source: {
    label: 'textLink.tsx',
    path: 'packages/design-system/src/components/textLink/textLink.tsx',
  },
} satisfies NavItem

export const copyButtonItem = {
  title: 'Copy Button',
  slug: 'copy-button',
  href: '/components/copy-button',
  description: 'An icon action that copies text and reports success or failure.',
  source: {
    label: 'copyButton.tsx',
    path: 'packages/design-system/src/components/copyButton/copyButton.tsx',
  },
} satisfies NavItem

export const themeSwitchItem = {
  title: 'Theme Switch',
  slug: 'theme-switch',
  href: '/components/theme-switch',
  description: 'An animated icon action for choosing between light and dark themes.',
  source: {
    label: 'themeSwitch.tsx',
    path: 'packages/design-system/src/components/themeSwitch/themeSwitch.tsx',
  },
} satisfies NavItem

export const toggleGroupItem = {
  title: 'Toggle Group',
  slug: 'toggle-group',
  href: '/components/toggle-group',
  description: 'A single- or multiple-selection group of related toggle buttons.',
  source: {
    label: 'toggleGroup.tsx',
    path: 'packages/design-system/src/components/toggleGroup/toggleGroup.tsx',
  },
} satisfies NavItem

export const workspaceTabsItem = {
  title: 'Workspace Tabs',
  slug: 'workspace-tabs',
  href: '/components/workspace-tabs',
  description:
    'Reorderable workspace tabs with fixed control areas and horizontally scrolling views.',
  source: {
    label: 'workspaceTabs.tsx',
    path: 'packages/design-system/src/components/workspaceTabs/workspaceTabs.tsx',
  },
} satisfies NavItem

export const checkboxItem = {
  title: 'Checkbox',
  slug: 'checkbox',
  href: '/components/checkbox',
  description: 'Binary and mixed-state selection with Field and native form integration.',
  source: {
    label: 'checkbox.tsx',
    path: 'packages/design-system/src/components/checkbox/checkbox.tsx',
  },
} satisfies NavItem

export const checkboxGroupItem = {
  title: 'Checkbox Group',
  slug: 'checkbox-group',
  href: '/components/checkbox-group',
  description: 'Multiple selection with contextual bulk actions and disabled-item preservation.',
  source: {
    label: 'checkboxGroup.tsx',
    path: 'packages/design-system/src/components/checkboxGroup/checkboxGroup.tsx',
  },
} satisfies NavItem

export const switchItem = {
  title: 'Switch',
  slug: 'switch',
  href: '/components/switch',
  description: 'A binary control for settings that take effect when switched on or off.',
  source: {
    label: 'switch.tsx',
    path: 'packages/design-system/src/components/switch/switch.tsx',
  },
} satisfies NavItem

export const tooltipItem = {
  title: 'Tooltip',
  slug: 'tooltip',
  href: '/components/tooltip',
  description: 'Supplementary non-interactive context shown when a trigger is hovered or focused.',
  source: {
    label: 'tooltip.tsx',
    path: 'packages/design-system/src/components/tooltip/tooltip.tsx',
  },
} satisfies NavItem

export const toastItem = {
  title: 'Toast',
  slug: 'toast',
  href: '/components/toast',
  description: 'Concise, temporary feedback for user-initiated actions.',
  source: {
    label: 'toaster.tsx',
    path: 'packages/design-system/src/components/toaster/toaster.tsx',
  },
} satisfies NavItem

export const spinnerItem = {
  title: 'Spinner',
  slug: 'spinner',
  href: '/components/spinner',
  description: 'A compact loading indicator with optional accessible status text.',
  source: {
    label: 'spinner.tsx',
    path: 'packages/design-system/src/components/spinner/spinner.tsx',
  },
} satisfies NavItem

export const iconItem = {
  title: 'Icon',
  slug: 'icon',
  href: '/components/icon',
  description: 'Decorative imported SVG artwork with constrained semantic sizing.',
  source: {
    label: 'icon.tsx',
    path: 'packages/design-system/src/components/icon/icon.tsx',
  },
} satisfies NavItem

export const inputItem = {
  title: 'Input',
  slug: 'input',
  href: '/components/input',
  description: 'Text input with design-system sizes and Base UI field integration.',
  source: {
    label: 'input.tsx',
    path: 'packages/design-system/src/components/input/input.tsx',
  },
} satisfies NavItem

export const inputGroupItem = {
  title: 'Input Group',
  slug: 'input-group',
  href: '/components/input-group',
  description: 'Compound text input with constrained static and interactive affixes.',
  source: {
    label: 'inputGroup.tsx',
    path: 'packages/design-system/src/components/inputGroup/inputGroup.tsx',
  },
} satisfies NavItem

export const keyboardInputItem = {
  title: 'Keyboard Input',
  slug: 'keyboard-input',
  href: '/components/keyboard-input',
  description: 'A semantic shortcut hint with ordered modifier combinations.',
  source: {
    label: 'keyboardInput.tsx',
    path: 'packages/design-system/src/components/keyboardInput/keyboardInput.tsx',
  },
} satisfies NavItem

export const codeEditorItem = {
  title: 'Code Editor',
  slug: 'code-editor',
  href: '/components/code-editor',
  description: 'JSON source editing with formatting, diagnostics, and capped presentation.',
  source: {
    label: 'codeEditor.tsx',
    path: 'packages/design-system/src/components/codeEditor/codeEditor.tsx',
  },
} satisfies NavItem

export const binaryValueItem = {
  title: 'Binary Value',
  slug: 'binary-value',
  href: '/components/binary-value',
  description: 'Compact byte counts and callback-driven binary inspection actions.',
  source: {
    label: 'binaryValue.tsx',
    path: 'packages/design-system/src/components/binaryValue/binaryValue.tsx',
  },
} satisfies NavItem

export const timestampValueItem = {
  title: 'Timestamp Value',
  slug: 'timestamp-value',
  href: '/components/timestamp-value',
  description: 'Compact local timestamps that preserve the exact ISO instant in semantic markup.',
  source: {
    label: 'timestampValue.tsx',
    path: 'packages/design-system/src/components/timestampValue/timestampValue.tsx',
  },
} satisfies NavItem

export const structuredValuePreviewItem = {
  title: 'Structured Value Preview',
  slug: 'structured-value-preview',
  href: '/components/structured-value-preview',
  description: 'Bounded inline summaries from normalized array, object, and scalar models.',
  source: {
    label: 'structuredValuePreview.tsx',
    path: 'packages/design-system/src/components/structuredValuePreview/structuredValuePreview.tsx',
  },
} satisfies NavItem

export const relationValueItem = {
  title: 'Relation Value',
  slug: 'relation-value',
  href: '/components/relation-value',
  description: 'Compact relation identifiers with optional target navigation.',
  source: {
    label: 'relationValue.tsx',
    path: 'packages/design-system/src/components/relationValue/relationValue.tsx',
  },
} satisfies NavItem

export const menuItem = {
  title: 'Menu',
  slug: 'menu',
  href: '/components/menu',
  description: 'Action menu built on Base UI Menu with grouped standard and checkbox items.',
  source: {
    label: 'menu.tsx',
    path: 'packages/design-system/src/components/menu/menu.tsx',
  },
} satisfies NavItem

export const contextMenuItem = {
  title: 'Context Menu',
  slug: 'context-menu',
  href: '/components/context-menu',
  description: 'Contextual actions opened from a pointer target without a visible trigger.',
  source: {
    label: 'contextMenu.tsx',
    path: 'packages/design-system/src/components/contextMenu/contextMenu.tsx',
  },
} satisfies NavItem

export const findBarItem = {
  title: 'Find Bar',
  slug: 'find-bar',
  href: '/components/find-bar',
  description:
    'Controlled document-find input with query options, match position, and occurrence navigation.',
  source: {
    label: 'findBar.tsx',
    path: 'packages/design-system/src/components/findBar/findBar.tsx',
  },
} satisfies NavItem

export const accordionItem = {
  title: 'Accordion',
  slug: 'accordion',
  href: '/components/accordion',
  description: 'Collapsible sections with Base UI behavior and compact Inspektor presentation.',
  source: {
    label: 'accordion.tsx',
    path: 'packages/design-system/src/components/accordion/accordion.tsx',
  },
} satisfies NavItem

export const treeItem = {
  title: 'Tree',
  slug: 'tree',
  href: '/components/tree',
  description:
    'Scrollable hierarchical navigation with expandable sections and current-page links.',
  source: {
    label: 'tree.tsx',
    path: 'packages/design-system/src/components/tree/tree.tsx',
  },
} satisfies NavItem

export const actionListItem = {
  title: 'Action List',
  slug: 'action-list',
  href: '/components/action-list',
  description: 'Selectable action rows with navigation triggers and composable trailing actions.',
  source: {
    label: 'actionList.tsx',
    path: 'packages/design-system/src/components/actionList/actionList.tsx',
  },
} satisfies NavItem

export const boxItem = {
  title: 'Box',
  slug: 'box',
  href: '/components/box',
  description: 'Token-constrained layout primitive for native structural elements.',
  source: {
    label: 'box.tsx',
    path: 'packages/design-system/src/components/box/box.tsx',
  },
} satisfies NavItem

export const sidePanelItem = {
  title: 'Side Panel',
  slug: 'side-panel',
  href: '/components/side-panel',
  description: 'Full-height panel structure with fixed header and footer regions.',
  source: {
    label: 'sidePanel.tsx',
    path: 'packages/design-system/src/components/sidePanel/sidePanel.tsx',
  },
} satisfies NavItem

export const floatingPanelItem = {
  title: 'Floating Panel',
  slug: 'floating-panel',
  href: '/components/floating-panel',
  description: 'A persistent non-modal controller surface with compact and expanded presentations.',
  source: {
    label: 'floatingPanel.tsx',
    path: 'packages/design-system/src/components/floatingPanel/floatingPanel.tsx',
  },
} satisfies NavItem

export const scrollAreaItem = {
  title: 'Scroll Area',
  slug: 'scroll-area',
  href: '/components/scroll-area',
  description:
    'A native scroll viewport with token-backed overlay scrollbars that do not change content geometry.',
  source: {
    label: 'scrollArea.tsx',
    path: 'packages/design-system/src/components/scrollArea/scrollArea.tsx',
  },
} satisfies NavItem

export const dataGridItem = {
  title: 'Data Grid',
  slug: 'data-grid',
  href: '/components/data-grid',
  description: 'Controlled TanStack table rendering with semantic structure and inspection states.',
  source: {
    label: 'dataGrid.tsx',
    path: 'packages/design-system/src/components/dataGrid/dataGrid.tsx',
  },
} satisfies NavItem

export const swimlaneTimelineItem = {
  title: 'Swimlane Timeline',
  slug: 'swimlane-timeline',
  href: '/components/swimlane-timeline',
  description:
    'Composable activity tracks aligned to shared snapshot columns in a collapsible native table.',
  source: {
    label: 'swimlaneTimeline.tsx',
    path: 'packages/design-system/src/components/swimlaneTimeline/swimlaneTimeline.tsx',
  },
} satisfies NavItem

export const jsonViewItem = {
  title: 'JSON View',
  slug: 'json-view',
  href: '/components/json-view',
  description:
    'Read-only JSON inspection with tree navigation, integrated copying, search highlighting, and bounded rendering.',
  source: {
    label: 'jsonView.tsx',
    path: 'packages/design-system/src/components/jsonView/jsonView.tsx',
  },
} satisfies NavItem

export const resizablePanelItem = {
  title: 'Resizable Panel',
  slug: 'resizable-panel',
  href: '/components/resizable-panel',
  description:
    'Accessible split panels with constrained handles, collapse controls, and layout persistence support.',
  source: {
    label: 'resizablePanel.tsx',
    path: 'packages/design-system/src/components/resizablePanel/resizablePanel.tsx',
  },
} satisfies NavItem

export const shellLayoutItem = {
  title: 'Shell Layout',
  slug: 'shell-layout',
  href: '/components/shell-layout',
  description:
    'Application shell geometry with fixed outer regions and optional resizable left and right docks.',
  source: {
    label: 'shellLayout.tsx',
    path: 'packages/design-system/src/components/shellLayout/shellLayout.tsx',
  },
} satisfies NavItem

export const comboboxItem = {
  title: 'Combobox',
  slug: 'combobox',
  href: '/components/combobox',
  description: 'Filterable single selection from a predefined collection.',
  source: {
    label: 'combobox.tsx',
    path: 'packages/design-system/src/components/combobox/combobox.tsx',
  },
} satisfies NavItem

export const contextSwitcherItem = {
  title: 'Context Switcher',
  slug: 'context-switcher',
  href: '/components/context-switcher',
  description: 'A searchable popup for changing the active application resource or scope.',
  source: {
    label: 'contextSwitcher.tsx',
    path: 'packages/design-system/src/components/contextSwitcher/contextSwitcher.tsx',
  },
} satisfies NavItem

export const multiSelectItem = {
  title: 'Multi Select',
  slug: 'multi-select',
  href: '/components/multi-select',
  description: 'Multiple selection with checkbox rows and contextual Check all and Only actions.',
  source: {
    label: 'multiSelect.tsx',
    path: 'packages/design-system/src/components/multiSelect/multiSelect.tsx',
  },
} satisfies NavItem

export const selectItem = {
  title: 'Select',
  slug: 'select',
  href: '/components/select',
  description: 'Single selection from a compact predefined collection.',
  source: {
    label: 'select.tsx',
    path: 'packages/design-system/src/components/select/select.tsx',
  },
} satisfies NavItem

export const calendarItem = {
  title: 'Calendar',
  slug: 'calendar',
  href: '/components/calendar',
  description: 'Standalone date selection with day, month, and year navigation.',
  source: {
    label: 'calendar.tsx',
    path: 'packages/design-system/src/components/calendar/calendar.tsx',
  },
} satisfies NavItem

export const datePickerItem = {
  title: 'DatePicker',
  slug: 'date-picker',
  href: '/components/date-picker',
  description:
    'Timestamp selection with popup and inline compositions, time entry, and explicit apply.',
  source: {
    label: 'datePicker.tsx',
    path: 'packages/design-system/src/components/datePicker/datePicker.tsx',
  },
} satisfies NavItem

export const fieldItem = {
  title: 'Field',
  slug: 'field',
  href: '/components/field',
  description: 'Accessible labels, descriptions, and validation for form controls.',
  source: {
    label: 'field.tsx',
    path: 'packages/design-system/src/components/field/field.tsx',
  },
} satisfies NavItem

export const fieldsetItem = {
  title: 'Fieldset',
  slug: 'fieldset',
  href: '/components/fieldset',
  description: 'Accessible grouping and shared disabled state for related form controls.',
  source: {
    label: 'fieldset.tsx',
    path: 'packages/design-system/src/components/fieldset/fieldset.tsx',
  },
} satisfies NavItem

export const textFieldItem = {
  title: 'Text Field',
  slug: 'text-field',
  href: '/components/text-field',
  description: 'Standard labeled text input with description and validation messaging.',
  source: {
    label: 'textField.tsx',
    path: 'packages/design-system/src/components/textField/textField.tsx',
  },
} satisfies NavItem

const componentItems: NavItem[] = [
  accordionItem,
  actionListItem,
  alertDialogItem,
  badgeItem,
  binaryValueItem,
  boxItem,
  buttonItem,
  buttonLinkItem,
  calendarItem,
  checkboxItem,
  checkboxGroupItem,
  codeEditorItem,
  comboboxItem,
  commandItem,
  contextMenuItem,
  contextSwitcherItem,
  copyButtonItem,
  dataGridItem,
  datePickerItem,
  dataGridFilterClauseItem,
  findBarItem,
  floatingPanelItem,
  iconItem,
  inputItem,
  inputGroupItem,
  jsonViewItem,
  keyboardInputItem,
  textLinkItem,
  menuItem,
  multiSelectItem,
  relationValueItem,
  resizablePanelItem,
  scrollAreaItem,
  shellLayoutItem,
  sidePanelItem,
  selectItem,
  spinnerItem,
  structuredValuePreviewItem,
  swimlaneTimelineItem,
  switchItem,
  themeSwitchItem,
  timestampValueItem,
  toastItem,
  tooltipItem,
  fieldItem,
  fieldsetItem,
  textFieldItem,
  workspaceTabsItem,
  treeItem,
  toggleGroupItem,
]

export const navSections: NavSection[] = [
  { title: 'Foundations', items: foundationItems },
  { title: 'Components', items: componentItems },
]

export const navigationItems = navSections.flatMap((section) => section.items)

export function getAdjacentNavigationItems(pathname: string) {
  const currentIndex = navigationItems.findIndex((item) => item.href === pathname)

  if (currentIndex < 0) {
    return { previous: undefined, next: undefined }
  }

  return {
    previous: navigationItems.at(currentIndex - 1) ?? navigationItems.at(-1),
    next: navigationItems[currentIndex + 1] ?? navigationItems[0],
  }
}

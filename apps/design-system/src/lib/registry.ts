export interface SourceReference {
  label: string
  path: string
}

export interface DocsItem {
  title: string
  slug: string
  href: string
  description: string
  source: SourceReference
}

export interface DocsSection {
  title: string
  items: readonly DocsItem[]
}

export const colorsFoundationItem = {
  title: 'Colors',
  slug: 'colors',
  href: '/foundations/colors',
  description: '',
  source: {
    label: 'semantics.stylex.ts',
    path: 'packages/design-system/src/tokens/semantics.stylex.ts',
  },
} satisfies DocsItem

export const typographyFoundationItem = {
  title: 'Typography',
  slug: 'typography',
  href: '/foundations/typography',
  description: '',
  source: {
    label: 'semantics.stylex.ts',
    path: 'packages/design-system/src/tokens/semantics.stylex.ts',
  },
} satisfies DocsItem

const foundationItems: readonly DocsItem[] = [colorsFoundationItem, typographyFoundationItem]

export const buttonItem = {
  title: 'Button',
  slug: 'button',
  href: '/components/button',
  description: '',
  source: {
    label: 'button.tsx',
    path: 'packages/design-system/src/components/button/button.tsx',
  },
} satisfies DocsItem

export const badgeItem = {
  title: 'Badge',
  slug: 'badge',
  href: '/components/badge',
  description: '',
  source: {
    label: 'badge.tsx',
    path: 'packages/design-system/src/components/badge/badge.tsx',
  },
} satisfies DocsItem

export const alertDialogItem = {
  title: 'Alert Dialog',
  slug: 'alert-dialog',
  href: '/components/alert-dialog',
  description: '',
  source: {
    label: 'alertDialog.tsx',
    path: 'packages/design-system/src/components/alertDialog/alertDialog.tsx',
  },
} satisfies DocsItem

export const commandItem = {
  title: 'Command',
  slug: 'command',
  href: '/components/command',
  description: '',
  source: {
    label: 'command.tsx',
    path: 'packages/design-system/src/components/command/command.tsx',
  },
} satisfies DocsItem

export const dataGridFilterClauseItem = {
  title: 'Data Grid Filter Clause',
  slug: 'data-grid-filter-clause',
  href: '/components/data-grid-filter-clause',
  description: '',
  source: {
    label: 'dataGridFilterClause.tsx',
    path: 'packages/design-system/src/components/dataGridFilterClause/dataGridFilterClause.tsx',
  },
} satisfies DocsItem

export const buttonLinkItem = {
  title: 'Button Link',
  slug: 'button-link',
  href: '/components/button-link',
  description: '',
  source: {
    label: 'buttonLink.tsx',
    path: 'packages/design-system/src/components/buttonLink/buttonLink.tsx',
  },
} satisfies DocsItem

export const textLinkItem = {
  title: 'Text Link',
  slug: 'text-link',
  href: '/components/text-link',
  description: '',
  source: {
    label: 'textLink.tsx',
    path: 'packages/design-system/src/components/textLink/textLink.tsx',
  },
} satisfies DocsItem

export const textItem = {
  title: 'Text',
  slug: 'text',
  href: '/components/text',
  description: '',
  source: {
    label: 'text.tsx',
    path: 'packages/design-system/src/components/text/text.tsx',
  },
} satisfies DocsItem

export const copyButtonItem = {
  title: 'Copy Button',
  slug: 'copy-button',
  href: '/components/copy-button',
  description: '',
  source: {
    label: 'copyButton.tsx',
    path: 'packages/design-system/src/components/copyButton/copyButton.tsx',
  },
} satisfies DocsItem

export const themeSwitchItem = {
  title: 'Theme Switch',
  slug: 'theme-switch',
  href: '/components/theme-switch',
  description: '',
  source: {
    label: 'themeSwitch.tsx',
    path: 'packages/design-system/src/components/themeSwitch/themeSwitch.tsx',
  },
} satisfies DocsItem

export const toggleGroupItem = {
  title: 'Toggle Group',
  slug: 'toggle-group',
  href: '/components/toggle-group',
  description: '',
  source: {
    label: 'toggleGroup.tsx',
    path: 'packages/design-system/src/components/toggleGroup/toggleGroup.tsx',
  },
} satisfies DocsItem

export const workspaceTabsItem = {
  title: 'Workspace Tabs',
  slug: 'workspace-tabs',
  href: '/components/workspace-tabs',
  description: '',
  source: {
    label: 'workspaceTabs.tsx',
    path: 'packages/design-system/src/components/workspaceTabs/workspaceTabs.tsx',
  },
} satisfies DocsItem

export const checkboxItem = {
  title: 'Checkbox',
  slug: 'checkbox',
  href: '/components/checkbox',
  description: '',
  source: {
    label: 'checkbox.tsx',
    path: 'packages/design-system/src/components/checkbox/checkbox.tsx',
  },
} satisfies DocsItem

export const checkboxGroupItem = {
  title: 'Checkbox Group',
  slug: 'checkbox-group',
  href: '/components/checkbox-group',
  description: '',
  source: {
    label: 'checkboxGroup.tsx',
    path: 'packages/design-system/src/components/checkboxGroup/checkboxGroup.tsx',
  },
} satisfies DocsItem

export const switchItem = {
  title: 'Switch',
  slug: 'switch',
  href: '/components/switch',
  description: '',
  source: {
    label: 'switch.tsx',
    path: 'packages/design-system/src/components/switch/switch.tsx',
  },
} satisfies DocsItem

export const tooltipItem = {
  title: 'Tooltip',
  slug: 'tooltip',
  href: '/components/tooltip',
  description: '',
  source: {
    label: 'tooltip.tsx',
    path: 'packages/design-system/src/components/tooltip/tooltip.tsx',
  },
} satisfies DocsItem

export const toastItem = {
  title: 'Toast',
  slug: 'toast',
  href: '/components/toast',
  description: '',
  source: {
    label: 'toaster.tsx',
    path: 'packages/design-system/src/components/toaster/toaster.tsx',
  },
} satisfies DocsItem

export const spinnerItem = {
  title: 'Spinner',
  slug: 'spinner',
  href: '/components/spinner',
  description: '',
  source: {
    label: 'spinner.tsx',
    path: 'packages/design-system/src/components/spinner/spinner.tsx',
  },
} satisfies DocsItem

export const iconItem = {
  title: 'Icon',
  slug: 'icon',
  href: '/components/icon',
  description: '',
  source: {
    label: 'icon.tsx',
    path: 'packages/design-system/src/components/icon/icon.tsx',
  },
} satisfies DocsItem

export const inputItem = {
  title: 'Input',
  slug: 'input',
  href: '/components/input',
  description: '',
  source: {
    label: 'input.tsx',
    path: 'packages/design-system/src/components/input/input.tsx',
  },
} satisfies DocsItem

export const inputGroupItem = {
  title: 'Input Group',
  slug: 'input-group',
  href: '/components/input-group',
  description: '',
  source: {
    label: 'inputGroup.tsx',
    path: 'packages/design-system/src/components/inputGroup/inputGroup.tsx',
  },
} satisfies DocsItem

export const keyboardInputItem = {
  title: 'Keyboard Input',
  slug: 'keyboard-input',
  href: '/components/keyboard-input',
  description: '',
  source: {
    label: 'keyboardInput.tsx',
    path: 'packages/design-system/src/components/keyboardInput/keyboardInput.tsx',
  },
} satisfies DocsItem

export const codeEditorItem = {
  title: 'Code Editor',
  slug: 'code-editor',
  href: '/components/code-editor',
  description: '',
  source: {
    label: 'codeEditor.tsx',
    path: 'packages/design-system/src/components/codeEditor/codeEditor.tsx',
  },
} satisfies DocsItem

export const binaryValueItem = {
  title: 'Binary Value',
  slug: 'binary-value',
  href: '/components/binary-value',
  description: '',
  source: {
    label: 'binaryValue.tsx',
    path: 'packages/design-system/src/components/binaryValue/binaryValue.tsx',
  },
} satisfies DocsItem

export const timestampValueItem = {
  title: 'Timestamp Value',
  slug: 'timestamp-value',
  href: '/components/timestamp-value',
  description: '',
  source: {
    label: 'timestampValue.tsx',
    path: 'packages/design-system/src/components/timestampValue/timestampValue.tsx',
  },
} satisfies DocsItem

export const structuredValuePreviewItem = {
  title: 'Structured Value Preview',
  slug: 'structured-value-preview',
  href: '/components/structured-value-preview',
  description: '',
  source: {
    label: 'structuredValuePreview.tsx',
    path: 'packages/design-system/src/components/structuredValuePreview/structuredValuePreview.tsx',
  },
} satisfies DocsItem

export const relationValueItem = {
  title: 'Relation Value',
  slug: 'relation-value',
  href: '/components/relation-value',
  description: '',
  source: {
    label: 'relationValue.tsx',
    path: 'packages/design-system/src/components/relationValue/relationValue.tsx',
  },
} satisfies DocsItem

export const middleTruncateItem = {
  title: 'Middle Truncate',
  slug: 'middle-truncate',
  href: '/components/middle-truncate',
  description: '',
  source: {
    label: 'middleTruncate.tsx',
    path: 'packages/design-system/src/components/middleTruncate/middleTruncate.tsx',
  },
} satisfies DocsItem

export const menuItem = {
  title: 'Menu',
  slug: 'menu',
  href: '/components/menu',
  description: '',
  source: {
    label: 'menu.tsx',
    path: 'packages/design-system/src/components/menu/menu.tsx',
  },
} satisfies DocsItem

export const contextMenuItem = {
  title: 'Context Menu',
  slug: 'context-menu',
  href: '/components/context-menu',
  description: '',
  source: {
    label: 'contextMenu.tsx',
    path: 'packages/design-system/src/components/contextMenu/contextMenu.tsx',
  },
} satisfies DocsItem

export const findBarItem = {
  title: 'Find Bar',
  slug: 'find-bar',
  href: '/components/find-bar',
  description: '',
  source: {
    label: 'findBar.tsx',
    path: 'packages/design-system/src/components/findBar/findBar.tsx',
  },
} satisfies DocsItem

export const accordionItem = {
  title: 'Accordion',
  slug: 'accordion',
  href: '/components/accordion',
  description: '',
  source: {
    label: 'accordion.tsx',
    path: 'packages/design-system/src/components/accordion/accordion.tsx',
  },
} satisfies DocsItem

export const treeItem = {
  title: 'Tree',
  slug: 'tree',
  href: '/components/tree',
  description: '',
  source: {
    label: 'tree.tsx',
    path: 'packages/design-system/src/components/tree/tree.tsx',
  },
} satisfies DocsItem

export const actionListItem = {
  title: 'Action List',
  slug: 'action-list',
  href: '/components/action-list',
  description: '',
  source: {
    label: 'actionList.tsx',
    path: 'packages/design-system/src/components/actionList/actionList.tsx',
  },
} satisfies DocsItem

export const boxItem = {
  title: 'Box',
  slug: 'box',
  href: '/components/box',
  description: '',
  source: {
    label: 'box.tsx',
    path: 'packages/design-system/src/components/box/box.tsx',
  },
} satisfies DocsItem

export const brandWordmarkItem = {
  title: 'Brand Wordmark',
  slug: 'brand-wordmark',
  href: '/components/brand-wordmark',
  description: 'Renders the canonical Inspektor wordmark for brand surfaces.',
  source: {
    label: 'wordmark.tsx',
    path: 'packages/design-system/src/brand/wordmark/wordmark.tsx',
  },
} satisfies DocsItem

export const sidePanelItem = {
  title: 'Side Panel',
  slug: 'side-panel',
  href: '/components/side-panel',
  description: '',
  source: {
    label: 'sidePanel.tsx',
    path: 'packages/design-system/src/components/sidePanel/sidePanel.tsx',
  },
} satisfies DocsItem

export const floatingPanelItem = {
  title: 'Floating Panel',
  slug: 'floating-panel',
  href: '/components/floating-panel',
  description: '',
  source: {
    label: 'floatingPanel.tsx',
    path: 'packages/design-system/src/components/floatingPanel/floatingPanel.tsx',
  },
} satisfies DocsItem

export const scrollAreaItem = {
  title: 'Scroll Area',
  slug: 'scroll-area',
  href: '/components/scroll-area',
  description: '',
  source: {
    label: 'scrollArea.tsx',
    path: 'packages/design-system/src/components/scrollArea/scrollArea.tsx',
  },
} satisfies DocsItem

export const dataGridItem = {
  title: 'Data Grid',
  slug: 'data-grid',
  href: '/components/data-grid',
  description: '',
  source: {
    label: 'dataGrid.tsx',
    path: 'packages/design-system/src/components/dataGrid/dataGrid.tsx',
  },
} satisfies DocsItem

export const swimlaneTimelineItem = {
  title: 'Swimlane Timeline',
  slug: 'swimlane-timeline',
  href: '/components/swimlane-timeline',
  description: '',
  source: {
    label: 'swimlaneTimeline.tsx',
    path: 'packages/design-system/src/components/swimlaneTimeline/swimlaneTimeline.tsx',
  },
} satisfies DocsItem

export const jsonViewItem = {
  title: 'JSON View',
  slug: 'json-view',
  href: '/components/json-view',
  description: '',
  source: {
    label: 'jsonView.tsx',
    path: 'packages/design-system/src/components/jsonView/jsonView.tsx',
  },
} satisfies DocsItem

export const resizablePanelItem = {
  title: 'Resizable Panel',
  slug: 'resizable-panel',
  href: '/components/resizable-panel',
  description: '',
  source: {
    label: 'resizablePanel.tsx',
    path: 'packages/design-system/src/components/resizablePanel/resizablePanel.tsx',
  },
} satisfies DocsItem

export const shellLayoutItem = {
  title: 'Shell Layout',
  slug: 'shell-layout',
  href: '/components/shell-layout',
  description: '',
  source: {
    label: 'shellLayout.tsx',
    path: 'packages/design-system/src/components/shellLayout/shellLayout.tsx',
  },
} satisfies DocsItem

export const comboboxItem = {
  title: 'Combobox',
  slug: 'combobox',
  href: '/components/combobox',
  description: '',
  source: {
    label: 'combobox.tsx',
    path: 'packages/design-system/src/components/combobox/combobox.tsx',
  },
} satisfies DocsItem

export const contextSwitcherItem = {
  title: 'Context Switcher',
  slug: 'context-switcher',
  href: '/components/context-switcher',
  description: '',
  source: {
    label: 'contextSwitcher.tsx',
    path: 'packages/design-system/src/components/contextSwitcher/contextSwitcher.tsx',
  },
} satisfies DocsItem

export const multiSelectItem = {
  title: 'Multi Select',
  slug: 'multi-select',
  href: '/components/multi-select',
  description: '',
  source: {
    label: 'multiSelect.tsx',
    path: 'packages/design-system/src/components/multiSelect/multiSelect.tsx',
  },
} satisfies DocsItem

export const selectItem = {
  title: 'Select',
  slug: 'select',
  href: '/components/select',
  description: '',
  source: {
    label: 'select.tsx',
    path: 'packages/design-system/src/components/select/select.tsx',
  },
} satisfies DocsItem

export const datePickerItem = {
  title: 'DatePicker',
  slug: 'date-picker',
  href: '/components/date-picker',
  description: '',
  source: {
    label: 'datePicker.tsx',
    path: 'packages/design-system/src/components/datePicker/datePicker.tsx',
  },
} satisfies DocsItem

export const fieldItem = {
  title: 'Field',
  slug: 'field',
  href: '/components/field',
  description: '',
  source: {
    label: 'field.tsx',
    path: 'packages/design-system/src/components/field/field.tsx',
  },
} satisfies DocsItem

export const fieldsetItem = {
  title: 'Fieldset',
  slug: 'fieldset',
  href: '/components/fieldset',
  description: '',
  source: {
    label: 'fieldset.tsx',
    path: 'packages/design-system/src/components/fieldset/fieldset.tsx',
  },
} satisfies DocsItem

export const textFieldItem = {
  title: 'Text Field',
  slug: 'text-field',
  href: '/components/text-field',
  description: '',
  source: {
    label: 'textField.tsx',
    path: 'packages/design-system/src/components/textField/textField.tsx',
  },
} satisfies DocsItem

const componentItems: readonly DocsItem[] = [
  accordionItem,
  actionListItem,
  alertDialogItem,
  badgeItem,
  binaryValueItem,
  boxItem,
  brandWordmarkItem,
  buttonItem,
  buttonLinkItem,
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
  middleTruncateItem,
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
  textItem,
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

export const docsSections: readonly DocsSection[] = [
  { title: 'Foundations', items: foundationItems },
  { title: 'Components', items: componentItems },
]

export const docsItems = docsSections.flatMap((section) => section.items)

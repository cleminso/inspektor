import { Combobox as BaseCombobox } from '@base-ui/react/combobox'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import * as stylex from '@stylexjs/stylex'
import { X } from 'lucide-react'
import {
  createContext,
  forwardRef,
  type ComponentPropsWithRef,
  type ComponentRef,
  type ForwardedRef,
  type RefAttributes,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
  useState,
} from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { scrollbarStyles } from '../../styles/scrollbar.styles'
import { Button } from '../button/button'
import { commandStyles } from './command.styles'

type WithoutStyles<Props> = Omit<Props, 'className' | 'style' | 'render'>

export interface CommandValue {
  label: string
  description?: string
  keywords?: readonly string[]
}

type BaseCommandRootProps<Value extends CommandValue> = BaseCombobox.Root.Props<Value, false>

export type CommandRootProps<Value extends CommandValue> = Pick<
  BaseCommandRootProps<Value>,
  'children' | 'disabled' | 'highlightItemOnHover' | 'itemToStringLabel' | 'onInputValueChange'
> & {
  /** Controls whether the first matching item is highlighted while filtering. */
  autoHighlight?: boolean
  /** Initial query for an uncontrolled command. */
  defaultInputValue?: string
  /** Controlled command query. */
  inputValue?: string
  /** Flat collection filtered by the command query. */
  items?: readonly Value[]
}
export interface CommandDialogProps extends Pick<
  BaseDialog.Root.Props,
  'defaultOpen' | 'disablePointerDismissal' | 'onOpenChange' | 'onOpenChangeComplete' | 'open'
> {
  /** Command content rendered inside the modal surface. */
  children?: ReactNode
  /** Keeps the dialog mounted while closed. */
  keepMounted?: boolean
  /** Determines where focus moves when the command dialog opens. */
  initialFocus?: BaseDialog.Popup.Props['initialFocus']
  /** Determines where focus moves after the command dialog closes. */
  finalFocus?: BaseDialog.Popup.Props['finalFocus']
}
export type CommandTitleProps = WithoutStyles<BaseDialog.Title.Props>
export type CommandCloseProps = Omit<
  WithoutStyles<BaseDialog.Close.Props>,
  'children' | 'nativeButton'
>
export interface CommandInputProps extends Omit<WithoutStyles<BaseCombobox.Input.Props>, 'size'> {
  /** Composes input behavior onto another input component. */
  render?: BaseCombobox.Input.Props['render']
  /** Controls whether the input separates itself from following command content. */
  divider?: 'bottom' | 'none'
}
export type CommandInputRowProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'style'>
export type CommandListProps = WithoutStyles<BaseCombobox.List.Props>
export type CommandGroupProps = WithoutStyles<BaseCombobox.Group.Props>
export type CommandGroupLabelProps = WithoutStyles<BaseCombobox.GroupLabel.Props>
export type CommandEmptyProps = WithoutStyles<BaseCombobox.Empty.Props>
export type CommandSeparatorProps = WithoutStyles<BaseCombobox.Separator.Props>
export type CommandItemProps<Value extends CommandValue> = Omit<
  WithoutStyles<BaseCombobox.Item.Props>,
  'value'
> & {
  value: Value
}
export interface CommandItemTextProps extends Omit<
  ComponentPropsWithRef<'span'>,
  'children' | 'className' | 'style'
> {
  /** Primary option label. */
  label: ReactNode
  /** Optional supporting description. */
  description?: ReactNode
  /** Arranges supporting metadata beside or below the primary label. */
  layout?: 'inline' | 'stacked'
}
export type CommandFooterProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'style'>
export type CommandShortcutProps = Omit<ComponentPropsWithRef<'span'>, 'className' | 'style'>
export type CommandKeyProps = Omit<ComponentPropsWithRef<'kbd'>, 'className' | 'style'>

function commandFilter<Value extends CommandValue>(item: Value, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (normalizedQuery.length === 0) return true
  const candidates = [item.label, item.description ?? '', ...(item.keywords ?? [])].map(
    (candidate) => candidate.toLocaleLowerCase(),
  )
  const isGlyphQuery = /^[^\p{L}\p{N}\s]+$/u.test(normalizedQuery)
  return candidates.some((candidate) =>
    isGlyphQuery === true ? candidate === normalizedQuery : candidate.includes(normalizedQuery),
  )
}

const CommandQueryContext = createContext('')
const CommandInputRowContext = createContext(false)

function CommandRoot<Value extends CommandValue>({
  autoHighlight = true,
  inputValue,
  defaultInputValue = '',
  onInputValueChange,
  ...props
}: CommandRootProps<Value>) {
  const [uncontrolledQuery, setUncontrolledQuery] = useState(defaultInputValue)
  const query = inputValue ?? uncontrolledQuery
  const filteredItems = props.items?.filter((item) => commandFilter(item, query))
  return (
    <CommandQueryContext.Provider value={query}>
      <div
        {...stylex.props(commandStyles.surface)}
        data-slot="command"
      >
        <BaseCombobox.Root
          {...props}
          filteredItems={filteredItems}
          inputValue={query}
          onInputValueChange={(nextQuery, details) => {
            if (inputValue === undefined) setUncontrolledQuery(nextQuery)
            onInputValueChange?.(nextQuery, details)
          }}
          autoHighlight={autoHighlight}
          filter={null}
          inline
          open
        />
      </div>
    </CommandQueryContext.Provider>
  )
}

function CommandDialog({
  defaultOpen = false,
  keepMounted = false,
  initialFocus = true,
  finalFocus = true,
  children,
  ...props
}: CommandDialogProps) {
  const backdropStyles = createStateStyleProps<BaseDialog.Backdrop.State>((state) => [
    commandStyles.backdrop,
    state.open === true && commandStyles.backdropOpen,
    state.open === false && commandStyles.backdropClosed,
    state.transitionStatus === 'starting' && commandStyles.backdropStarting,
    state.transitionStatus === 'ending' && commandStyles.backdropEnding,
  ])
  const viewportStyles = createStateStyleProps<BaseDialog.Viewport.State>((state) => [
    commandStyles.viewport,
    state.open === true && commandStyles.viewportOpen,
    state.open === false && commandStyles.viewportClosed,
    state.nested === true && commandStyles.viewportNested,
    state.nestedDialogOpen === true && commandStyles.viewportNestedDialogOpen,
    state.transitionStatus === 'starting' && commandStyles.viewportStarting,
    state.transitionStatus === 'ending' && commandStyles.viewportEnding,
  ])
  const popupStyles = createStateStyleProps<BaseDialog.Popup.State>((state) => [
    commandStyles.popup,
    state.open === true && commandStyles.popupOpen,
    state.open === false && commandStyles.popupClosed,
    state.nested === true && commandStyles.popupNested,
    state.nestedDialogOpen === true && commandStyles.popupNestedDialogOpen,
    state.transitionStatus === 'starting' && commandStyles.popupStarting,
    state.transitionStatus === 'ending' && commandStyles.popupEnding,
  ])
  return (
    <BaseDialog.Root
      {...props}
      defaultOpen={defaultOpen}
      modal
    >
      <BaseDialog.Portal keepMounted={keepMounted}>
        <BaseDialog.Backdrop {...backdropStyles} />
        <BaseDialog.Viewport {...viewportStyles}>
          <BaseDialog.Popup
            initialFocus={initialFocus}
            finalFocus={finalFocus}
            {...popupStyles}
          >
            {children}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}

const CommandTitle = forwardRef<ComponentRef<typeof BaseDialog.Title>, CommandTitleProps>(
  function CommandTitle(props, ref) {
    return (
      <BaseDialog.Title
        {...props}
        ref={ref}
        {...stylex.props(commandStyles.title)}
      />
    )
  },
)
const CommandClose = forwardRef<ComponentRef<typeof BaseDialog.Close>, CommandCloseProps>(
  function CommandClose(props, ref) {
    return (
      <div
        {...stylex.props(commandStyles.close)}
        data-slot="command-close"
      >
        <BaseDialog.Close
          {...props}
          ref={ref}
          aria-label="Close command"
          nativeButton
          render={
            <Button
              aria-label="Close command"
              glyphSize="compact"
              iconOnly
              size="xs"
              variant="ghost"
            />
          }
        >
          <Button.Glyph artwork={X} />
        </BaseDialog.Close>
      </div>
    )
  },
)

const CommandInput = forwardRef<ComponentRef<typeof BaseCombobox.Input>, CommandInputProps>(
  function CommandInput({ divider = 'bottom', ...props }, ref) {
    const inInputRow = useContext(CommandInputRowContext)
    const stateStyles = createStateStyleProps<BaseCombobox.Input.State>(() => [
      commandStyles.input,
      divider === 'none' && commandStyles.inputWithoutDivider,
      inInputRow === true && commandStyles.inputInRow,
    ])
    return (
      <BaseCombobox.Input
        {...props}
        ref={ref}
        {...stateStyles}
        data-divider={divider}
        data-slot="command-input"
      />
    )
  },
)
const CommandInputRow = forwardRef<HTMLDivElement, CommandInputRowProps>(function CommandInputRow(
  { children, ...props },
  ref,
) {
  return (
    <CommandInputRowContext.Provider value>
      <div
        {...props}
        ref={ref}
        role={props.role ?? 'group'}
        {...stylex.props(commandStyles.inputRow, scrollbarStyles.hidden)}
        data-scrollbar="hidden"
      >
        {children}
      </div>
    </CommandInputRowContext.Provider>
  )
})

const CommandList = forwardRef<ComponentRef<typeof BaseCombobox.List>, CommandListProps>(
  function CommandList(props, ref) {
    const stateStyles = createStateStyleProps<BaseCombobox.List.State>((state) => [
      commandStyles.list,
      scrollbarStyles.standard,
      state.empty === true && commandStyles.listEmpty,
    ])
    return (
      <BaseCombobox.List
        {...props}
        ref={ref}
        {...stateStyles}
        data-slot="command-list"
      />
    )
  },
)

const CommandGroup = forwardRef<ComponentRef<typeof BaseCombobox.Group>, CommandGroupProps>(
  function CommandGroup(props, ref) {
    return (
      <BaseCombobox.Group
        {...props}
        ref={ref}
        {...stylex.props(commandStyles.group)}
      />
    )
  },
)
const CommandGroupLabel = forwardRef<
  ComponentRef<typeof BaseCombobox.GroupLabel>,
  CommandGroupLabelProps
>(function CommandGroupLabel(props, ref) {
  return (
    <BaseCombobox.GroupLabel
      {...props}
      ref={ref}
      {...stylex.props(commandStyles.groupLabel)}
    />
  )
})
const CommandEmpty = forwardRef<ComponentRef<typeof BaseCombobox.Empty>, CommandEmptyProps>(
  function CommandEmpty(props, ref) {
    return (
      <BaseCombobox.Empty
        {...props}
        ref={ref}
        {...stylex.props(commandStyles.empty)}
      />
    )
  },
)
const CommandSeparator = forwardRef<
  ComponentRef<typeof BaseCombobox.Separator>,
  CommandSeparatorProps
>(function CommandSeparator(props, ref) {
  return (
    <BaseCombobox.Separator
      {...props}
      ref={ref}
      {...stylex.props(commandStyles.separator)}
    />
  )
})

function CommandItemInner<Value extends CommandValue>(
  {
    children,
    value,
    'aria-label': ariaLabel,
    'aria-describedby': describedBy,
    'aria-labelledby': labelledBy,
    ...props
  }: CommandItemProps<Value>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const query = useContext(CommandQueryContext)
  const descriptionId = useId()
  if (commandFilter(value, query) === false) return null
  const stateStyles = createStateStyleProps<BaseCombobox.Item.State>((state) => [
    commandStyles.item,
    state.highlighted === true && commandStyles.itemHighlighted,
    state.selected === true && commandStyles.itemSelected,
    state.disabled === true && commandStyles.itemDisabled,
  ])
  const descriptionIds = [describedBy, value.description === undefined ? undefined : descriptionId]
    .filter(Boolean)
    .join(' ')
  return (
    <BaseCombobox.Item
      aria-label={ariaLabel ?? (labelledBy === undefined ? value.label : undefined)}
      aria-describedby={descriptionIds || undefined}
      aria-labelledby={labelledBy}
      {...props}
      ref={ref}
      value={value}
      {...stateStyles}
    >
      {children}
      {value.description === undefined ? null : (
        <span
          id={descriptionId}
          hidden
        >
          {value.description}
        </span>
      )}
    </BaseCombobox.Item>
  )
}
const CommandItem = forwardRef(CommandItemInner) as <Value extends CommandValue>(
  props: CommandItemProps<Value> & RefAttributes<HTMLDivElement>,
) => ReactElement | null

function CommandItemText({
  label,
  description,
  layout = 'stacked',
  ...props
}: CommandItemTextProps) {
  return (
    <span
      {...props}
      {...stylex.props(commandStyles.itemText, layout === 'inline' && commandStyles.itemTextInline)}
      data-layout={layout}
    >
      <span {...stylex.props(commandStyles.itemLabel)}>{label}</span>
      {description === undefined ? null : (
        <span {...stylex.props(commandStyles.itemDescription)}>{description}</span>
      )}
    </span>
  )
}

const CommandFooter = forwardRef<HTMLDivElement, CommandFooterProps>(
  function CommandFooter(props, ref) {
    return (
      <div
        {...props}
        ref={ref}
        {...stylex.props(commandStyles.footer)}
      />
    )
  },
)
const CommandShortcut = forwardRef<HTMLSpanElement, CommandShortcutProps>(
  function CommandShortcut(props, ref) {
    return (
      <span
        {...props}
        ref={ref}
        {...stylex.props(commandStyles.shortcut)}
      />
    )
  },
)
const CommandKey = forwardRef<HTMLElement, CommandKeyProps>(function CommandKey(props, ref) {
  return (
    <kbd
      {...props}
      ref={ref}
      {...stylex.props(commandStyles.key)}
    />
  )
})
export const Command = Object.assign(CommandRoot, {
  Root: CommandRoot,
  Dialog: CommandDialog,
  Title: CommandTitle,
  Close: CommandClose,
  Input: CommandInput,
  InputRow: CommandInputRow,
  List: CommandList,
  Group: CommandGroup,
  GroupLabel: CommandGroupLabel,
  Item: CommandItem,
  ItemText: CommandItemText,
  Empty: CommandEmpty,
  Separator: CommandSeparator,
  Shortcut: CommandShortcut,
  Key: CommandKey,
  Footer: CommandFooter,
})

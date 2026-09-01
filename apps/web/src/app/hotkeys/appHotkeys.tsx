import { Command, KeyboardInput } from '@inspector/ds'
import {
  HotkeysProvider,
  useHotkey,
  type Hotkey,
  type HotkeysProviderOptions,
} from '@tanstack/react-hotkeys'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { appHotkeys } from './hotkeyCatalog'

export interface AppCommand {
  description?: string
  disabled?: boolean
  hotkey?: Hotkey
  id: string
  label: string
  perform: () => void
}

interface AppCommandsRegistrationContextValue {
  register: (ownerId: string, commands: readonly AppCommand[]) => () => void
}

interface AppCommandPaletteContextValue {
  open: () => void
}

const AppCommandsListContext = createContext<readonly AppCommand[] | null>(null)
const AppCommandPaletteContext = createContext<AppCommandPaletteContextValue | null>(null)
const AppCommandsRegistrationContext = createContext<AppCommandsRegistrationContextValue | null>(
  null,
)
const hotkeysProviderOptions = {
  hotkey: { conflictBehavior: 'error' },
} satisfies HotkeysProviderOptions

/**
 * Returns whether a global hotkey originated from an interaction layer that owns the keyboard.
 * Expanded comboboxes are checked separately because their listboxes can be rendered in a portal.
 */
export function isAppHotkeyInteractionLayer(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    (target.matches('[role="combobox"][aria-expanded="true"]') ||
      target.closest('[role="alertdialog"], [role="dialog"], [role="listbox"], [role="menu"]') !==
        null)
  )
}

export function runAppHotkey(event: KeyboardEvent, command: () => void): void {
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

export const appHotkeyOptions = {
  ignoreInputs: true,
  preventDefault: false,
  stopPropagation: false,
} as const

function AppCommandPalette({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
}): React.ReactElement {
  const commands = use(AppCommandsListContext)
  if (commands === null) {
    throw new Error('AppCommandPalette must be rendered within AppHotkeysProvider')
  }

  const [query, setQuery] = useState('')

  useHotkey(
    appHotkeys.openCommandPalette,
    (event) => {
      if (
        event.defaultPrevented === true ||
        event.isComposing === true ||
        (open === false && isAppHotkeyInteractionLayer(event.target))
      ) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      onOpenChange(open === false)
    },
    {
      ignoreInputs: false,
      preventDefault: false,
      stopPropagation: false,
    },
  )

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen)
      if (nextOpen === false) {
        setQuery('')
      }
    },
    [onOpenChange],
  )

  return (
    <Command.Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <Command.Title>Commands</Command.Title>
      <Command.Root
        items={commands}
        itemToStringLabel={(command) => command.label}
        inputValue={query}
        onInputValueChange={setQuery}
      >
        <Command.InputRow aria-label="Command query">
          <Command.Input
            aria-label="Search commands"
            placeholder="Search commands"
          />
        </Command.InputRow>
        <Command.List>
          <Command.Empty>
            {commands.length === 0 ? 'No commands available.' : 'No matching commands.'}
          </Command.Empty>
          {commands.map((command) => (
            <Command.Item
              key={command.id}
              value={command}
              disabled={command.disabled === true}
              onClick={() => {
                if (command.disabled === true) {
                  return
                }
                command.perform()
                handleOpenChange(false)
              }}
            >
              <Command.ItemText
                label={command.label}
                description={command.description}
              />
              {command.hotkey === undefined ? null : (
                <Command.Shortcut>
                  <KeyboardInput
                    hotkey={command.hotkey}
                    size="small"
                  />
                </Command.Shortcut>
              )}
            </Command.Item>
          ))}
        </Command.List>
        <Command.Footer>
          <span>
            <Command.Key>↑ ↓</Command.Key> Navigate
          </span>
          <span>
            <Command.Key>Enter</Command.Key> Select
          </span>
          <span>
            <Command.Key>Esc</Command.Key> Close
          </span>
        </Command.Footer>
      </Command.Root>
      <Command.Close />
    </Command.Dialog>
  )
}

/**
 * Installs the application hotkey registry and renders the command palette for registered commands.
 */
export function AppHotkeysProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [registrations, setRegistrations] = useState(() => new Map<string, readonly AppCommand[]>())
  const register = useCallback((ownerId: string, commands: readonly AppCommand[]) => {
    setRegistrations((current) => {
      const next = new Map(current)
      next.set(ownerId, commands)
      return next
    })
    return () => {
      setRegistrations((current) => {
        if (current.has(ownerId) === false) {
          return current
        }
        const next = new Map(current)
        next.delete(ownerId)
        return next
      })
    }
  }, [])
  const commands = useMemo(() => Array.from(registrations.values()).flat(), [registrations])
  const registrationContextValue = useMemo<AppCommandsRegistrationContextValue>(
    () => ({ register }),
    [register],
  )
  const openCommandPalette = useCallback(() => {
    setPaletteOpen(true)
  }, [])
  const paletteContextValue = useMemo<AppCommandPaletteContextValue>(
    () => ({ open: openCommandPalette }),
    [openCommandPalette],
  )

  return (
    <HotkeysProvider defaultOptions={hotkeysProviderOptions}>
      <AppCommandPaletteContext.Provider value={paletteContextValue}>
        <AppCommandsRegistrationContext.Provider value={registrationContextValue}>
          <AppCommandsListContext.Provider value={commands}>
            {children}
            <AppCommandPalette
              open={paletteOpen}
              onOpenChange={setPaletteOpen}
            />
          </AppCommandsListContext.Provider>
        </AppCommandsRegistrationContext.Provider>
      </AppCommandPaletteContext.Provider>
    </HotkeysProvider>
  )
}

export function useAppCommandPalette(): AppCommandPaletteContextValue {
  const context = use(AppCommandPaletteContext)
  if (context === null) {
    throw new Error('useAppCommandPalette must be used within AppHotkeysProvider')
  }
  return context
}

/** Registers commands for the lifetime of the calling component. */
export function useAppCommands(commands: readonly AppCommand[]): void {
  const context = use(AppCommandsRegistrationContext)
  const ownerId = useId()
  if (context === null) {
    throw new Error('useAppCommands must be used within AppHotkeysProvider')
  }

  const { register } = context
  useEffect(() => register(ownerId, commands), [commands, ownerId, register])
}

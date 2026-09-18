import * as stylex from '@stylexjs/stylex'
import { Moon, Sun } from 'lucide-react'
import { type ReactElement, useEffect, useState, useSyncExternalStore } from 'react'

import { Button } from '../button/button'
import { Tooltip } from '../tooltip/tooltip'
import { themeSwitchAnimationDurationMs, themeSwitchStyles } from './themeSwitch.styles'

export type ThemeSwitchTheme = 'light' | 'dark'

export interface ThemeSwitchProps {
  /** The active color theme. */
  theme: ThemeSwitchTheme
  /** Runs with the opposite color theme when the switch is activated. */
  onThemeChange: (theme: ThemeSwitchTheme) => void
}

type AnimationPhase = 'idle' | 'exiting' | 'entering'

interface ThemeAnimationState {
  displayedTheme: ThemeSwitchTheme
  requestedTheme: ThemeSwitchTheme
  phase: AnimationPhase
}

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

function getReducedMotionSnapshot(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(reducedMotionQuery).matches
    : false
}

function subscribeToReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined
  }

  const mediaQuery = window.matchMedia(reducedMotionQuery)
  mediaQuery.addEventListener('change', onStoreChange)
  return () => mediaQuery.removeEventListener('change', onStoreChange)
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToReducedMotion, getReducedMotionSnapshot, () => false)
}

function advanceAnimation(current: ThemeAnimationState): ThemeAnimationState {
  if (current.phase === 'exiting') {
    return {
      ...current,
      displayedTheme: current.requestedTheme,
      phase: 'entering',
    }
  }

  if (current.phase === 'entering') {
    return {
      ...current,
      phase: current.displayedTheme === current.requestedTheme ? 'idle' : 'exiting',
    }
  }

  return current
}

export function ThemeSwitch({ theme, onThemeChange }: ThemeSwitchProps): ReactElement {
  const reduceMotion = useReducedMotion()
  const [animation, setAnimation] = useState<ThemeAnimationState>({
    displayedTheme: theme,
    requestedTheme: theme,
    phase: 'idle',
  })
  const destinationTheme = theme === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${destinationTheme} theme`
  const displayedIcon = animation.displayedTheme === 'dark' ? 'sun' : 'moon'
  const artwork = displayedIcon === 'sun' ? Sun : Moon

  useEffect(() => {
    setAnimation((current) => {
      if (reduceMotion === true) {
        return current.displayedTheme === theme && current.phase === 'idle'
          ? current
          : { displayedTheme: theme, requestedTheme: theme, phase: 'idle' }
      }

      if (current.requestedTheme === theme) {
        return current
      }

      return {
        ...current,
        requestedTheme: theme,
        phase:
          current.phase === 'idle' && current.displayedTheme !== theme ? 'exiting' : current.phase,
      }
    })
  }, [reduceMotion, theme])

  useEffect(() => {
    if (animation.phase === 'idle' || reduceMotion === true) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setAnimation(advanceAnimation)
    }, themeSwitchAnimationDurationMs)
    return () => window.clearTimeout(timeout)
  }, [animation.phase, reduceMotion])

  const animationStyle =
    animation.phase === 'idle'
      ? null
      : displayedIcon === 'sun'
        ? animation.phase === 'entering'
          ? themeSwitchStyles.sunEnter
          : themeSwitchStyles.sunExit
        : animation.phase === 'entering'
          ? themeSwitchStyles.moonEnter
          : themeSwitchStyles.moonExit

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <Button
            aria-label={label}
            iconOnly
            onClick={() => onThemeChange(destinationTheme)}
            size="s"
            variant="ghost"
          >
            <span
              data-animation-phase={animation.phase}
              data-slot="theme-switch-icon"
              data-theme-icon={displayedIcon}
              {...stylex.props(themeSwitchStyles.icon, animationStyle)}
            >
              <Button.Glyph artwork={artwork} />
            </span>
          </Button>
        }
      />
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip.Root>
  )
}

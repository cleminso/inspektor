import * as stylex from '@stylexjs/stylex'
import type { CSSProperties, ReactNode } from 'react'
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner'

import { backgroundColors, borderColors, textColors } from '../../tokens/semantics.stylex'
import { borderRadii } from '../../tokens/value.stylex'
import { toasterStyles } from './toaster.styles'

export type ToasterPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface ToasterProps {
  /** Places the application toast stack at a viewport edge. */
  position?: ToasterPosition
  /** Shows a dismiss button on each toast. */
  closeButton?: boolean
}

export type ToastId = string | number

export interface ToastOptions {
  /** Adds supporting content below the primary message. */
  description?: ReactNode
  /** Keeps the toast visible until it is dismissed. */
  preserve?: boolean
  /** Identifies a toast so it can be updated or dismissed. */
  id?: ToastId
}

export interface Toasts {
  message: (content: ReactNode, options?: ToastOptions) => ToastId
  success: (content: ReactNode, options?: ToastOptions) => ToastId
  warning: (content: ReactNode, options?: ToastOptions) => ToastId
  error: (content: ReactNode, options?: ToastOptions) => ToastId
  info: (content: ReactNode, options?: ToastOptions) => ToastId
  loading: (content: ReactNode, options?: ToastOptions) => ToastId
  dismiss: (id?: ToastId) => ToastId
}

function getSonnerOptions(options: ToastOptions | undefined) {
  return {
    description:
      options?.description === undefined ? undefined : (
        <span style={{ color: textColors['text-muted'] }}>
          {options.description}
        </span>
      ),
    duration: options?.preserve === true ? Number.POSITIVE_INFINITY : undefined,
    id: options?.id,
  }
}

export const toasts: Toasts = {
  message: (content, options) => sonnerToast(content, getSonnerOptions(options)),
  success: (content, options) => sonnerToast.success(content, getSonnerOptions(options)),
  warning: (content, options) => sonnerToast.warning(content, getSonnerOptions(options)),
  error: (content, options) => sonnerToast.error(content, getSonnerOptions(options)),
  info: (content, options) => sonnerToast.info(content, getSonnerOptions(options)),
  loading: (content, options) => sonnerToast.loading(content, getSonnerOptions(options)),
  dismiss: (id) => sonnerToast.dismiss(id),
}

export function Toaster({ position = 'bottom-right', closeButton = true }: ToasterProps) {
  const toasterStyleProps = stylex.props(toasterStyles.toaster)
  const toastStyleProps = stylex.props(toasterStyles.toast)
  const tokenStyles = {
    '--normal-bg': backgroundColors['bg-card'],
    '--normal-text': textColors['text-default'],
    '--normal-border': borderColors.border,
    '--border-radius': borderRadii.s,
  } as CSSProperties

  return (
    <SonnerToaster
      theme="system"
      position={position}
      closeButton={closeButton}
      className={toasterStyleProps.className}
      style={{ ...toasterStyleProps.style, ...tokenStyles }}
      toastOptions={{
        classNames: {
          toast: toastStyleProps.className,
        },
      }}
    />
  )
}

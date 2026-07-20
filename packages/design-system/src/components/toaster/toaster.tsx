'use client'

import { Toast as BaseToast } from '@base-ui/react/toast'
import * as stylex from '@stylexjs/stylex'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { toasterStyles } from './toaster.styles'

export type ToastId = string | number
export type ToastStatus = 'message' | 'success' | 'warning' | 'error' | 'loading'

export interface ToasterProps {}

export interface ToastOptions {
  /** Adds supporting content below the primary message. */
  description?: string
  /** Keeps the toast visible until it is dismissed. */
  preserve?: boolean
  /** Identifies a toast so it can be updated or dismissed. */
  id?: ToastId
  /** Adds the fixed Undo action to a reversible operation. */
  undo?: () => void
}

export interface ToastPromiseOptions<Data> {
  /** Announces that the asynchronous operation has started. */
  loading: string
  /** Announces that the asynchronous operation completed. */
  success: string | ((data: Data) => string)
  /** Announces that the asynchronous operation failed. */
  error: string | ((error: unknown) => string)
}

export interface Toasts {
  message: (content: string, options?: ToastOptions) => ToastId
  success: (content: string, options?: ToastOptions) => ToastId
  warning: (content: string, options?: ToastOptions) => ToastId
  error: (content: string, options?: ToastOptions) => ToastId
  promise: <Data>(promise: Promise<Data>, options: ToastPromiseOptions<Data>) => Promise<Data>
  dismiss: (id?: ToastId) => void
}

const toastManager = BaseToast.createToastManager()

function normalizeToastId(id: ToastId): string {
  return `${typeof id}:${id}`
}

function getToastOptions(
  content: string,
  status: Exclude<ToastStatus, 'loading'>,
  options?: ToastOptions,
) {
  return {
    actionProps:
      options?.undo === undefined ? undefined : { children: 'Undo', onClick: options.undo },
    description: options?.description,
    id: options?.id === undefined ? undefined : normalizeToastId(options.id),
    timeout: options?.preserve === true ? 0 : undefined,
    title: content,
    type: status,
  }
}

export const toasts: Toasts = {
  message: (content, options) => toastManager.add(getToastOptions(content, 'message', options)),
  success: (content, options) => toastManager.add(getToastOptions(content, 'success', options)),
  warning: (content, options) => toastManager.add(getToastOptions(content, 'warning', options)),
  error: (content, options) => toastManager.add(getToastOptions(content, 'error', options)),
  promise: (promise, options) => {
    const managedPromise = toastManager.promise(promise, {
      loading: { title: options.loading, type: 'loading' },
      success: (data) => ({
        title: typeof options.success === 'function' ? options.success(data) : options.success,
        type: 'success',
      }),
      error: (error) => ({
        title: typeof options.error === 'function' ? options.error(error) : options.error,
        type: 'error',
      }),
    })

    void managedPromise.catch(() => undefined)
    return promise
  },
  dismiss: (id) => toastManager.close(id === undefined ? undefined : normalizeToastId(id)),
}

const statusStyles = {
  message: undefined,
  success: toasterStyles.toastSuccess,
  warning: toasterStyles.toastWarning,
  error: toasterStyles.toastError,
  loading: undefined,
} satisfies Record<ToastStatus, unknown>

const stackOrderStyles = [
  toasterStyles.toastFrontmost,
  toasterStyles.toastMiddle,
  toasterStyles.toastBack,
] as const

function getToastStatus(type: string | undefined): ToastStatus {
  if (type === 'success' || type === 'warning' || type === 'error' || type === 'loading') {
    return type
  }
  return 'message'
}

function ToastList() {
  const { toasts: activeToasts } = BaseToast.useToastManager()

  return activeToasts.map((toast, index) => {
    const status = getToastStatus(toast.type)
    const rootStyleProps = createStateStyleProps<BaseToast.Root.State>((state) => [
      toasterStyles.toast,
      statusStyles[status],
      stackOrderStyles[Math.min(index, stackOrderStyles.length - 1)],
      state.expanded === true && toasterStyles.toastExpanded,
      state.limited === true && toasterStyles.toastLimited,
      state.transitionStatus === 'starting' && toasterStyles.toastStarting,
      state.transitionStatus === 'ending' && toasterStyles.toastEnding,
      state.transitionStatus === 'ending' &&
        state.swipeDirection === 'left' &&
        toasterStyles.toastEndingLeft,
      state.transitionStatus === 'ending' &&
        state.swipeDirection === 'right' &&
        toasterStyles.toastEndingRight,
      state.transitionStatus === 'ending' &&
        state.swipeDirection === 'up' &&
        toasterStyles.toastEndingUp,
      state.transitionStatus === 'ending' &&
        state.swipeDirection === 'down' &&
        toasterStyles.toastEndingDown,
    ])
    const contentStyleProps = createStateStyleProps<BaseToast.Content.State>((state) => [
      toasterStyles.content,
      state.behind === true && toasterStyles.contentBehind,
      state.expanded === true && toasterStyles.contentExpanded,
    ])

    return (
      <BaseToast.Root
        key={toast.id}
        toast={toast}
        swipeDirection={['down', 'right']}
        {...rootStyleProps}
        data-slot="toast"
        data-status={status}
      >
        <BaseToast.Content {...contentStyleProps}>
          <span {...stylex.props(toasterStyles.text)}>
            <BaseToast.Title {...stylex.props(toasterStyles.title)} />
            <BaseToast.Description
              {...stylex.props(toasterStyles.description)}
              data-slot="toast-description"
            />
          </span>
          <BaseToast.Action {...stylex.props(toasterStyles.action)} />
          <BaseToast.Close {...stylex.props(toasterStyles.close)} aria-label="Dismiss notification">
            <svg
              aria-hidden="true"
              fill="none"
              viewBox="0 0 16 16"
              {...stylex.props(toasterStyles.closeIcon)}
            >
              <path
                d="M4.5 4.5l7 7m0-7-7 7"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          </BaseToast.Close>
        </BaseToast.Content>
      </BaseToast.Root>
    )
  })
}

export function Toaster(_props: ToasterProps) {
  return (
    <BaseToast.Provider toastManager={toastManager} limit={3} timeout={5_000}>
      <BaseToast.Portal>
        <BaseToast.Viewport
          {...stylex.props(toasterStyles.viewport)}
          aria-label="Notifications"
          data-slot="toast-viewport"
        >
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  )
}

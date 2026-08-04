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
    id: normalizeToastId(options?.id ?? content),
    timeout: options?.preserve === true ? 0 : undefined,
    title: content,
    type: status,
  }
}

function addToast(
  content: string,
  status: Exclude<ToastStatus, 'loading'>,
  options?: ToastOptions,
): ToastId {
  const id = options?.id ?? content
  toastManager.add(getToastOptions(content, status, options))
  return id
}

export const toasts: Toasts = {
  message: (content, options) => addToast(content, 'message', options),
  success: (content, options) => addToast(content, 'success', options),
  warning: (content, options) => addToast(content, 'warning', options),
  error: (content, options) => addToast(content, 'error', options),
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
  message: toasterStyles.toastMessage,
  success: toasterStyles.toastSuccess,
  warning: toasterStyles.toastWarning,
  error: toasterStyles.toastError,
  loading: toasterStyles.toastLoading,
} satisfies Record<ToastStatus, unknown>

const titleStatusStyles = {
  message: toasterStyles.titleMessage,
  success: toasterStyles.titleSuccess,
  warning: toasterStyles.titleWarning,
  error: toasterStyles.titleError,
  loading: toasterStyles.titleLoading,
} satisfies Record<ToastStatus, unknown>

const descriptionStatusStyles = {
  message: toasterStyles.descriptionMessage,
  success: toasterStyles.descriptionSuccess,
  warning: toasterStyles.descriptionWarning,
  error: toasterStyles.descriptionError,
  loading: toasterStyles.descriptionLoading,
} satisfies Record<ToastStatus, unknown>

const actionStatusStyles = {
  message: toasterStyles.actionMessage,
  success: toasterStyles.actionSuccess,
  warning: toasterStyles.actionWarning,
  error: toasterStyles.actionError,
  loading: toasterStyles.actionLoading,
} satisfies Record<ToastStatus, unknown>

const closeStatusStyles = {
  message: toasterStyles.closeMessage,
  success: toasterStyles.closeSuccess,
  warning: toasterStyles.closeWarning,
  error: toasterStyles.closeError,
  loading: toasterStyles.closeLoading,
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
      toast.updateKey !== undefined &&
        toast.updateKey > 0 &&
        (toast.updateKey % 2 === 0 ? toasterStyles.pulseEven : toasterStyles.pulseOdd),
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
      state.swiping === true && toasterStyles.toastSwiping,
      state.swipeDirection === 'left' && toasterStyles.toastSwipeLeft,
      state.swipeDirection === 'right' && toasterStyles.toastSwipeRight,
      state.swipeDirection === 'up' && toasterStyles.toastSwipeUp,
      state.swipeDirection === 'down' && toasterStyles.toastSwipeDown,
    ])
    const contentStyleProps = createStateStyleProps<BaseToast.Content.State>((state) => [
      toasterStyles.content,
      state.behind === true && toasterStyles.contentBehind,
      state.expanded === true && toasterStyles.contentExpanded,
    ])
    const titleStyleProps = createStateStyleProps<BaseToast.Title.State>((state) => [
      toasterStyles.title,
      state.type !== undefined && titleStatusStyles[getToastStatus(state.type)],
    ])
    const descriptionStyleProps = createStateStyleProps<BaseToast.Description.State>((state) => [
      toasterStyles.description,
      state.type !== undefined && descriptionStatusStyles[getToastStatus(state.type)],
    ])
    const actionStyleProps = createStateStyleProps<BaseToast.Action.State>((state) => [
      toasterStyles.action,
      state.type !== undefined && actionStatusStyles[getToastStatus(state.type)],
    ])
    const closeStyleProps = createStateStyleProps<BaseToast.Close.State>((state) => [
      toasterStyles.close,
      state.type !== undefined && closeStatusStyles[getToastStatus(state.type)],
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
            <BaseToast.Title {...titleStyleProps} />
            <BaseToast.Description
              {...descriptionStyleProps}
              data-slot="toast-description"
            />
          </span>
          <BaseToast.Action {...actionStyleProps} />
          <BaseToast.Close {...closeStyleProps} aria-label="Dismiss notification">
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
  const viewportStyleProps = createStateStyleProps<BaseToast.Viewport.State>((state) => [
    toasterStyles.viewport,
    state.expanded === true && toasterStyles.viewportExpanded,
  ])
  return (
    <BaseToast.Provider toastManager={toastManager} limit={3} timeout={5_000}>
      <BaseToast.Portal>
        <BaseToast.Viewport
          {...viewportStyleProps}
          aria-label="Notifications"
          data-slot="toast-viewport"
        >
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  )
}

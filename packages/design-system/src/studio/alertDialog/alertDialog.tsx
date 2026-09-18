import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog'
import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithRef, type ComponentRef } from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { Button } from '../button/button'
import { alertDialogStyles } from './alertDialog.styles'

type WithoutStyles<Props> = Omit<Props, 'className' | 'style' | 'render'>

export interface AlertDialogRootProps extends Pick<
  BaseAlertDialog.Root.Props,
  'children' | 'defaultOpen' | 'open' | 'onOpenChange'
> {
  /** Whether the alert dialog is initially open. */
  defaultOpen?: boolean
  /** Whether the alert dialog is currently open. */
  open?: boolean
  /** Runs when the alert dialog requests to open or close. */
  onOpenChange?: BaseAlertDialog.Root.Props['onOpenChange']
}

export interface AlertDialogContentProps extends WithoutStyles<BaseAlertDialog.Popup.Props> {
  /** Keeps the dialog content mounted while it is closed. */
  keepMounted?: boolean
  /** Determines where focus moves when the dialog opens. */
  initialFocus?: BaseAlertDialog.Popup.Props['initialFocus']
  /** Determines where focus moves when the dialog closes. */
  finalFocus?: BaseAlertDialog.Popup.Props['finalFocus']
}

export type AlertDialogTitleProps = WithoutStyles<BaseAlertDialog.Title.Props>

export type AlertDialogDescriptionProps = WithoutStyles<BaseAlertDialog.Description.Props>

export type AlertDialogActionsProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'style'>

export interface AlertDialogCloseProps extends Omit<
  WithoutStyles<BaseAlertDialog.Close.Props>,
  'nativeButton'
> {
  /** Composes close behavior onto a design-system Button. */
  render?: BaseAlertDialog.Close.Props['render']
}

function AlertDialogRoot({ defaultOpen = false, ...props }: AlertDialogRootProps) {
  return (
    <BaseAlertDialog.Root
      {...props}
      defaultOpen={defaultOpen}
    />
  )
}

const AlertDialogContent = forwardRef<HTMLDivElement, AlertDialogContentProps>(
  function AlertDialogContent({ keepMounted = false, ...props }, ref) {
    const backdropStateStyles = createStateStyleProps<BaseAlertDialog.Backdrop.State>((state) => [
      alertDialogStyles.backdrop,
      state.open === true && alertDialogStyles.backdropOpen,
      state.open === false && alertDialogStyles.backdropClosed,
      state.transitionStatus === 'starting' && alertDialogStyles.backdropStarting,
      state.transitionStatus === 'ending' && alertDialogStyles.backdropEnding,
    ])
    const viewportStateStyles = createStateStyleProps<BaseAlertDialog.Viewport.State>((state) => [
      alertDialogStyles.viewport,
      state.open === true && alertDialogStyles.viewportOpen,
      state.open === false && alertDialogStyles.viewportClosed,
      state.nested === true && alertDialogStyles.viewportNested,
      state.nestedDialogOpen === true && alertDialogStyles.viewportNestedDialogOpen,
      state.transitionStatus === 'starting' && alertDialogStyles.viewportStarting,
      state.transitionStatus === 'ending' && alertDialogStyles.viewportEnding,
    ])
    const popupStateStyles = createStateStyleProps<BaseAlertDialog.Popup.State>((state) => [
      alertDialogStyles.popup,
      state.open === true && alertDialogStyles.popupOpen,
      state.open === false && alertDialogStyles.popupClosed,
      state.nested === true && alertDialogStyles.popupNested,
      state.nestedDialogOpen === true && alertDialogStyles.popupNestedDialogOpen,
      state.transitionStatus === 'starting' && alertDialogStyles.popupStarting,
      state.transitionStatus === 'ending' && alertDialogStyles.popupEnding,
    ])

    return (
      <BaseAlertDialog.Portal keepMounted={keepMounted}>
        <BaseAlertDialog.Backdrop {...backdropStateStyles} />
        <BaseAlertDialog.Viewport {...viewportStateStyles}>
          <BaseAlertDialog.Popup
            {...props}
            ref={ref}
            {...popupStateStyles}
          />
        </BaseAlertDialog.Viewport>
      </BaseAlertDialog.Portal>
    )
  },
)

const AlertDialogTitle = forwardRef<
  ComponentRef<typeof BaseAlertDialog.Title>,
  AlertDialogTitleProps
>(function AlertDialogTitle(props, ref) {
  return (
    <BaseAlertDialog.Title
      {...props}
      ref={ref}
      {...stylex.props(alertDialogStyles.title)}
    />
  )
})

const AlertDialogDescription = forwardRef<
  ComponentRef<typeof BaseAlertDialog.Description>,
  AlertDialogDescriptionProps
>(function AlertDialogDescription(props, ref) {
  return (
    <BaseAlertDialog.Description
      {...props}
      ref={ref}
      {...stylex.props(alertDialogStyles.description)}
    />
  )
})

const AlertDialogActions = forwardRef<HTMLDivElement, AlertDialogActionsProps>(
  function AlertDialogActions(props, ref) {
    return (
      <div
        {...props}
        ref={ref}
        {...stylex.props(alertDialogStyles.actions)}
      />
    )
  },
)

const AlertDialogClose = forwardRef<HTMLElement, AlertDialogCloseProps>(function AlertDialogClose(
  { render = <Button variant="secondary" />, ...props },
  ref,
) {
  const stateStyleProps = createStateStyleProps<BaseAlertDialog.Close.State>((state) => [
    state.disabled === true ? alertDialogStyles.closeDisabled : alertDialogStyles.closeEnabled,
  ])

  return (
    <BaseAlertDialog.Close
      {...props}
      ref={ref as BaseAlertDialog.Close.Props['ref']}
      nativeButton
      render={render}
      {...stateStyleProps}
    />
  )
})

export const AlertDialog = Object.assign(AlertDialogRoot, {
  Root: AlertDialogRoot,
  Content: AlertDialogContent,
  Title: AlertDialogTitle,
  Description: AlertDialogDescription,
  Actions: AlertDialogActions,
  Close: AlertDialogClose,
})

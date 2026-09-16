import * as stylex from '@stylexjs/stylex'
import {
  forwardRef,
  useCallback,
  type ComponentPropsWithRef,
  type ComponentPropsWithoutRef,
  type Ref,
} from 'react'

import { brandTextStyles } from './text.styles'

export type BrandTextVariant = 'pageHeading' | 'sectionHeading' | 'description'

export interface BrandTextProps extends Omit<ComponentPropsWithoutRef<'p'>, 'className' | 'style'> {
  /** Receives the rendered text element. */
  ref?: Ref<HTMLElement>
  /** Selects the semantic brand text role and its native element. */
  variant: BrandTextVariant
}

export type BrandTextLineProps = Omit<ComponentPropsWithRef<'span'>, 'className' | 'style'>

const variantStyles = {
  pageHeading: brandTextStyles.pageHeading,
  sectionHeading: brandTextStyles.sectionHeading,
  description: brandTextStyles.description,
} satisfies Record<BrandTextVariant, unknown>

const BrandTextComponent = forwardRef<HTMLElement, Omit<BrandTextProps, 'ref'>>(function BrandText(
  { children, variant, ...props },
  forwardedRef,
) {
  const {
    className: _className,
    style: _style,
    ...textProps
  } = props as ComponentPropsWithoutRef<'p'>
  const styleProps = stylex.props(brandTextStyles.root, variantStyles[variant])
  const setElementRef = useCallback(
    (element: HTMLElement | null) => {
      if (typeof forwardedRef === 'function') {
        return forwardedRef(element)
      } else if (forwardedRef !== null) {
        forwardedRef.current = element
      }
    },
    [forwardedRef],
  )

  if (variant === 'pageHeading') {
    return (
      <h1
        {...textProps}
        ref={setElementRef}
        data-slot="brand-text"
        data-variant={variant}
        {...styleProps}
      >
        {children}
      </h1>
    )
  }

  if (variant === 'sectionHeading') {
    return (
      <h2
        {...textProps}
        ref={setElementRef}
        data-slot="brand-text"
        data-variant={variant}
        {...styleProps}
      >
        {children}
      </h2>
    )
  }

  return (
    <p
      {...textProps}
      ref={setElementRef}
      data-slot="brand-text"
      data-variant={variant}
      {...styleProps}
    >
      {children}
    </p>
  )
})

const BrandTextLine = forwardRef<HTMLSpanElement, BrandTextLineProps>(
  function BrandTextLine(props, forwardedRef) {
    const {
      className: _className,
      style: _style,
      ...lineProps
    } = props as ComponentPropsWithRef<'span'>

    return (
      <span
        {...lineProps}
        ref={forwardedRef}
        data-slot="brand-text-line"
        {...stylex.props(brandTextStyles.line)}
      />
    )
  },
)

/** Renders one of the closed brand typography roles. */
export const BrandText = Object.assign(BrandTextComponent, {
  Line: BrandTextLine,
})

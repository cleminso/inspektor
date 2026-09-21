import { forwardRef, type ComponentPropsWithoutRef } from 'react'

type GlyphProps = Omit<
  ComponentPropsWithoutRef<'svg'>,
  'aria-hidden' | 'children' | 'focusable' | 'viewBox'
>

export interface CheckGlyphProps extends GlyphProps {
  variant?: 'check' | 'indeterminate'
}

export const GithubGlyph = forwardRef<SVGSVGElement, GlyphProps>(function GithubGlyph(
  props,
  forwardedRef,
) {
  return (
    <svg
      {...props}
      ref={forwardedRef}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M16 22.0268V19.1568C16.0375 18.68 15.9731 18.2006 15.811 17.7506C15.6489 17.3006 15.3929 16.8902 15.06 16.5468C18.2 16.1968 21.5 15.0068 21.5 9.54679C21.4997 8.15062 20.9627 6.80799 20 5.79679C20.4558 4.5753 20.4236 3.22514 19.91 2.02679C19.91 2.02679 18.73 1.67679 16 3.50679C13.708 2.88561 11.292 2.88561 8.99999 3.50679C6.26999 1.67679 5.08999 2.02679 5.08999 2.02679C4.57636 3.22514 4.54413 4.5753 4.99999 5.79679C4.03011 6.81549 3.49251 8.17026 3.49999 9.57679C3.49999 14.9968 6.79998 16.1868 9.93998 16.5768C9.61098 16.9168 9.35725 17.3222 9.19529 17.7667C9.03334 18.2112 8.96679 18.6849 8.99999 19.1568V22.0268"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 20.0267C6 20.9999 3.5 20.0267 2 17.0267"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
})

export function CheckGlyph({ variant = 'check', ...props }: CheckGlyphProps) {
  return (
    <svg
      {...props}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
    >
      <path d={variant === 'indeterminate' ? 'M4 8h8' : 'm3 8 3 3 7-7'} />
    </svg>
  )
}

export interface CloseGlyphProps extends GlyphProps {
  geometry?: 'inset' | 'edge'
}

export function CloseGlyph({ geometry = 'inset', ...props }: CloseGlyphProps) {
  return (
    <svg
      {...props}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
    >
      <path
        d={geometry === 'edge' ? 'm4 4 8 8M12 4l-8 8' : 'M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5'}
      />
    </svg>
  )
}

export interface ChevronDownGlyphProps extends GlyphProps {
  variant?: 'stroke' | 'solid'
}

export function ChevronDownGlyph({ variant = 'stroke', ...props }: ChevronDownGlyphProps) {
  return (
    <svg
      {...props}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
    >
      <path
        d={
          variant === 'solid'
            ? 'm14.06 5.5-.53.53-4.82 4.82a1 1 0 0 1-1.42 0L2.47 6.03l-.53-.53L3 4.44l.53.53L8 9.44l4.47-4.47.53-.53z'
            : 'm4 6 4 4 4-4'
        }
      />
    </svg>
  )
}

export function ChevronRightGlyph(props: GlyphProps) {
  return (
    <svg
      {...props}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
    >
      <path d="m6 3 5 5-5 5" />
    </svg>
  )
}

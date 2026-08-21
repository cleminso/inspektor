import type { ComponentPropsWithoutRef } from 'react'

type GlyphProps = Omit<
  ComponentPropsWithoutRef<'svg'>,
  'aria-hidden' | 'children' | 'focusable' | 'viewBox'
>

export interface CheckGlyphProps extends GlyphProps {
  variant?: 'check' | 'indeterminate'
}

export function CheckGlyph({ variant = 'check', ...props }: CheckGlyphProps) {
  return (
    <svg {...props} aria-hidden="true" focusable="false" viewBox="0 0 16 16">
      <path d={variant === 'indeterminate' ? 'M4 8h8' : 'm3 8 3 3 7-7'} />
    </svg>
  )
}

export interface CloseGlyphProps extends GlyphProps {
  geometry?: 'inset' | 'edge'
}

export function CloseGlyph({ geometry = 'inset', ...props }: CloseGlyphProps) {
  return (
    <svg {...props} aria-hidden="true" focusable="false" viewBox="0 0 16 16">
      <path
        d={
          geometry === 'edge'
            ? 'm4 4 8 8M12 4l-8 8'
            : 'M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5'
        }
      />
    </svg>
  )
}

export interface ChevronDownGlyphProps extends GlyphProps {
  variant?: 'stroke' | 'solid'
}

export function ChevronDownGlyph({ variant = 'stroke', ...props }: ChevronDownGlyphProps) {
  return (
    <svg {...props} aria-hidden="true" focusable="false" viewBox="0 0 16 16">
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
    <svg {...props} aria-hidden="true" focusable="false" viewBox="0 0 16 16">
      <path d="m6 3 5 5-5 5" />
    </svg>
  )
}

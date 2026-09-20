import * as stylex from '@stylexjs/stylex'
import { forwardRef, useId, type ComponentPropsWithRef } from 'react'

import { brandNotFoundIllustrationStyles } from './notFoundIllustration.styles'

const tileWidth = 12
const tileHeight = 10
const tileGap = 2
const digitWidth = tileWidth * 4 + tileGap * 3
const digitGap = 16

const glyphs = {
  four: ['#..#', '#..#', '####', '...#', '...#'],
  zero: ['####', '#..#', '#..#', '#..#', '####'],
} as const

type Glyph = keyof typeof glyphs

export type BrandNotFoundIllustrationProps = Omit<
  ComponentPropsWithRef<'svg'>,
  | 'aria-label'
  | 'aria-labelledby'
  | 'children'
  | 'className'
  | 'dangerouslySetInnerHTML'
  | 'height'
  | 'role'
  | 'style'
  | 'viewBox'
  | 'width'
>

/** Renders the brand's tile-based 404 illustration. */
export const BrandNotFoundIllustration = forwardRef<SVGSVGElement, BrandNotFoundIllustrationProps>(
  function BrandNotFoundIllustration(props, forwardedRef) {
    const {
      children: _children,
      className: _className,
      dangerouslySetInnerHTML: _dangerouslySetInnerHTML,
      style: _style,
      ...illustrationProps
    } = props as ComponentPropsWithRef<'svg'>
    const instanceId = useId()
    const tileId = `${instanceId}-tile`

    return (
      <svg
        {...illustrationProps}
        ref={forwardedRef}
        aria-label="404"
        data-slot="brand-not-found-illustration"
        role="img"
        viewBox={`0 0 ${digitWidth * 3 + digitGap * 2} ${tileHeight * 5 + tileGap * 4}`}
        {...stylex.props(brandNotFoundIllustrationStyles.root)}
      >
        <defs>
          <rect
            id={tileId}
            width={tileWidth}
            height={tileHeight}
            rx={2}
          />
        </defs>
        <g fill="currentColor">
          <Digit
            glyph="four"
            tileId={tileId}
          />
          <Digit
            glyph="zero"
            offset={digitWidth + digitGap}
            tileId={tileId}
          />
          <Digit
            glyph="four"
            offset={(digitWidth + digitGap) * 2}
            tileId={tileId}
          />
        </g>
      </svg>
    )
  },
)

function Digit({
  glyph,
  offset = 0,
  tileId,
}: {
  glyph: Glyph
  offset?: number
  tileId: string
}): React.ReactElement {
  return (
    <g transform={`translate(${offset})`}>
      {glyphs[glyph].flatMap((row, rowIndex) =>
        [...row].flatMap((cell, columnIndex) =>
          cell === '#' ? (
            <use
              key={`${rowIndex}-${columnIndex}`}
              href={`#${tileId}`}
              x={columnIndex * (tileWidth + tileGap)}
              y={rowIndex * (tileHeight + tileGap)}
            />
          ) : (
            []
          ),
        ),
      )}
    </g>
  )
}

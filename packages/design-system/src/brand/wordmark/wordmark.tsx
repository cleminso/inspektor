import * as stylex from '@stylexjs/stylex'
import { forwardRef, useId, type ComponentPropsWithRef } from 'react'

import { brandWordmarkStyles } from './brandWordmark.styles'

export type BrandWordmarkProps = Omit<
  ComponentPropsWithRef<'svg'>,
  | 'aria-label'
  | 'aria-labelledby'
  | 'children'
  | 'className'
  | 'height'
  | 'role'
  | 'style'
  | 'viewBox'
  | 'width'
>

/** Renders the canonical Inspektor wordmark. */
export const BrandWordmark = forwardRef<SVGSVGElement, BrandWordmarkProps>(
  function BrandWordmark(props, forwardedRef) {
    const {
      'aria-labelledby': _ariaLabelledby,
      className: _className,
      style: _style,
      ...wordmarkProps
    } = props as ComponentPropsWithRef<'svg'>
    const instanceId = useId()
    const tileId = `${instanceId}-tile`
    const barId = `${instanceId}-bar`

    return (
      <svg
        {...wordmarkProps}
        ref={forwardedRef}
        aria-label="Inspektor"
        data-slot="brand-wordmark"
        role="img"
        viewBox="0 0 432 62"
        {...stylex.props(brandWordmarkStyles.root)}
      >
        <defs>
          <rect
            id={tileId}
            width="12"
            height="10"
            rx="2"
          />
          <rect
            id={barId}
            width="40"
            height="10"
            rx="2"
          />
        </defs>
        <g fill="currentColor">
          <g>
            <use href={`#${barId}`} />
            <use
              href={`#${tileId}`}
              x="14"
              y="13"
            />
            <use
              href={`#${tileId}`}
              x="14"
              y="26"
            />
            <use
              href={`#${tileId}`}
              x="14"
              y="39"
            />
            <use
              href={`#${barId}`}
              y="52"
            />
          </g>
          <g transform="translate(48)">
            <use href={`#${tileId}`} />
            <use
              href={`#${tileId}`}
              x="32"
            />
            <use
              href={`#${tileId}`}
              y="13"
            />
            <use
              href={`#${tileId}`}
              x="8"
              y="13"
            />
            <use
              href={`#${tileId}`}
              x="32"
              y="13"
            />
            <use
              href={`#${tileId}`}
              y="26"
            />
            <use
              href={`#${tileId}`}
              x="16"
              y="26"
            />
            <use
              href={`#${tileId}`}
              x="32"
              y="26"
            />
            <use
              href={`#${tileId}`}
              y="39"
            />
            <use
              href={`#${tileId}`}
              x="24"
              y="39"
            />
            <use
              href={`#${tileId}`}
              x="32"
              y="39"
            />
            <use
              href={`#${tileId}`}
              y="52"
            />
            <use
              href={`#${tileId}`}
              x="32"
              y="52"
            />
          </g>
          <g transform="translate(100)">
            <use href={`#${barId}`} />
            <use
              href={`#${tileId}`}
              y="13"
            />
            <use
              href={`#${barId}`}
              y="26"
            />
            <use
              href={`#${tileId}`}
              x="28"
              y="39"
            />
            <use
              href={`#${barId}`}
              y="52"
            />
          </g>
          <g transform="translate(148)">
            <use href={`#${barId}`} />
            <use
              href={`#${tileId}`}
              y="13"
            />
            <use
              href={`#${tileId}`}
              x="28"
              y="13"
            />
            <use
              href={`#${barId}`}
              y="26"
            />
            <use
              href={`#${tileId}`}
              y="39"
            />
            <use
              href={`#${tileId}`}
              y="52"
            />
          </g>
          <g transform="translate(196)">
            <use href={`#${barId}`} />
            <use
              href={`#${tileId}`}
              y="13"
            />
            <use
              href={`#${barId}`}
              y="26"
            />
            <use
              href={`#${tileId}`}
              y="39"
            />
            <use
              href={`#${barId}`}
              y="52"
            />
          </g>
          <g transform="translate(244)">
            <use href={`#${tileId}`} />
            <use
              href={`#${tileId}`}
              x="32"
            />
            <use
              href={`#${tileId}`}
              y="13"
            />
            <use
              href={`#${tileId}`}
              x="24"
              y="13"
            />
            <use
              href={`#${tileId}`}
              y="26"
            />
            <use
              href={`#${tileId}`}
              x="16"
              y="26"
            />
            <use
              href={`#${tileId}`}
              y="39"
            />
            <use
              href={`#${tileId}`}
              x="24"
              y="39"
            />
            <use
              href={`#${tileId}`}
              y="52"
            />
            <use
              href={`#${tileId}`}
              x="32"
              y="52"
            />
          </g>
          <g transform="translate(296)">
            <use href={`#${barId}`} />
            <use
              href={`#${tileId}`}
              x="14"
              y="13"
            />
            <use
              href={`#${tileId}`}
              x="14"
              y="26"
            />
            <use
              href={`#${tileId}`}
              x="14"
              y="39"
            />
            <use
              href={`#${tileId}`}
              x="14"
              y="52"
            />
          </g>
          <g transform="translate(344)">
            <use href={`#${barId}`} />
            <use
              href={`#${tileId}`}
              y="13"
            />
            <use
              href={`#${tileId}`}
              x="28"
              y="13"
            />
            <use
              href={`#${tileId}`}
              y="26"
            />
            <use
              href={`#${tileId}`}
              x="28"
              y="26"
            />
            <use
              href={`#${tileId}`}
              y="39"
            />
            <use
              href={`#${tileId}`}
              x="28"
              y="39"
            />
            <use
              href={`#${barId}`}
              y="52"
            />
          </g>
          <g transform="translate(392)">
            <use href={`#${barId}`} />
            <use
              href={`#${tileId}`}
              y="13"
            />
            <use
              href={`#${tileId}`}
              x="28"
              y="13"
            />
            <use
              href={`#${barId}`}
              y="26"
            />
            <use
              href={`#${tileId}`}
              y="39"
            />
            <use
              href={`#${tileId}`}
              x="24"
              y="39"
            />
            <use
              href={`#${tileId}`}
              y="52"
            />
            <use
              href={`#${tileId}`}
              x="32"
              y="52"
            />
          </g>
        </g>
      </svg>
    )
  },
)

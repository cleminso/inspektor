import * as stylex from '@stylexjs/stylex'
import type { ReactElement } from 'react'
import { MiddleTruncate } from '../middleTruncate/middleTruncate'
import { TextLink } from '../textLink/textLink'
import { relationValueStyles } from './relationValue.styles'

export type RelationValueNavigation =
  | { href: string; render?: never }
  | { href?: never; render: ReactElement }

export interface RelationValueProps {
  /** Complete relation identifier stored in the source record. */
  id: string
  /** Optional target navigation without coupling the component to an application router. */
  navigation?: RelationValueNavigation
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      {...stylex.props(relationValueStyles.arrow)}
    >
      <path d="M2 6h7M6.5 2.5 10 6 6.5 9.5" />
    </svg>
  )
}

export function RelationValue(props: RelationValueProps) {
  return (
    <span
      data-slot="relation-value"
      {...stylex.props(relationValueStyles.compact)}
    >
      <span
        data-typography="mono"
        translate="no"
        {...stylex.props(relationValueStyles.compactValue, relationValueStyles.compactId)}
      >
        {props.navigation === undefined ? (
          <MiddleTruncate value={props.id} />
        ) : (
          <TextLink {...props.navigation}>
            <span {...stylex.props(relationValueStyles.compactNavigation)}>
              <span
                {...stylex.props(
                  relationValueStyles.compactNavigationValue,
                  relationValueStyles.compactId,
                )}
              >
                <MiddleTruncate value={props.id} />
              </span>
              <span
                aria-hidden="true"
                data-slot="relation-value-navigation-icon"
                {...stylex.props(relationValueStyles.compactNavigationIcon)}
              >
                <ArrowIcon />
              </span>
            </span>
          </TextLink>
        )}
      </span>
    </span>
  )
}

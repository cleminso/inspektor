import * as stylex from '@stylexjs/stylex'
import { ArrowRight } from 'lucide-react'
import type { ReactElement } from 'react'
import { Icon } from '../icon/icon'
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
                <Icon
                  artwork={ArrowRight}
                  size="xs"
                />
              </span>
            </span>
          </TextLink>
        )}
      </span>
    </span>
  )
}

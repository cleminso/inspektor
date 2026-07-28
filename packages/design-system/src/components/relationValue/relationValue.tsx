import * as stylex from "@stylexjs/stylex";
import type { ReactElement } from "react";
import { CopyButton } from "../copyButton/copyButton";
import { Input } from "../input/input";
import { InputGroup } from "../inputGroup/inputGroup";
import { TextLink } from "../textLink/textLink";
import { relationValueStyles } from "./relationValue.styles";

export type RelationValueState =
  | { status: "pending" }
  | { status: "resolved"; displayValue: string }
  | { status: "missing" };

export type RelationValueNavigation =
  | { href: string; render?: never }
  | { href?: never; render: ReactElement };

export interface RelationValueProps {
  /** Complete relation identifier stored in the source record. */
  id: string;
  /** Optional target navigation without coupling the component to an application router. */
  navigation?: RelationValueNavigation;
}

export interface RelationDetailsProps extends RelationValueProps {
  /** Current state of target resolution. */
  state: RelationValueState;
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" {...stylex.props(relationValueStyles.arrow)}>
      <path d="M2 6h7M6.5 2.5 10 6 6.5 9.5" />
    </svg>
  );
}

export function RelationDetails(props: RelationDetailsProps) {
  return (
    <div {...stylex.props(relationValueStyles.details)}>
      <dl {...stylex.props(relationValueStyles.fields)}>
        <div {...stylex.props(relationValueStyles.field)}>
          <dt {...stylex.props(relationValueStyles.label)}>Stored ID</dt>
          <dd {...stylex.props(relationValueStyles.groupValue)}>
            <InputGroup fullWidth>
              <Input aria-label="Stored relation ID" readOnly value={props.id} />
              <InputGroup.Suffix>
                <span {...stylex.props(relationValueStyles.groupActions)}>
                  {props.navigation === undefined ? null : (
                    <TextLink {...props.navigation}>Open target</TextLink>
                  )}
                </span>
              </InputGroup.Suffix>
            </InputGroup>
          </dd>
        </div>
        {props.state.status === "resolved" ? (
          <div {...stylex.props(relationValueStyles.field)}>
            <dt {...stylex.props(relationValueStyles.label)}>Display value</dt>
            <dd {...stylex.props(relationValueStyles.displayValue)}>
              <span {...stylex.props(relationValueStyles.value)}>{props.state.displayValue}</span>
              <CopyButton
                textToCopy={props.state.displayValue}
                label="Copy display value"
                copiedLabel="Display value copied"
                errorLabel="Could not copy display value"
                size="s"
              />
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function RelationValue(props: RelationValueProps) {
  return (
    <span {...stylex.props(relationValueStyles.compact)}>
      {props.navigation === undefined ? (
        <span {...stylex.props(relationValueStyles.compactId)}>{props.id}</span>
      ) : (
        <TextLink {...props.navigation} trailingIcon={<ArrowIcon />}>
          {props.id}
        </TextLink>
      )}
    </span>
  );
}

import { Button as BaseButton } from "@base-ui/react/button";
import * as stylex from "@stylexjs/stylex";
import { CircleAlert, X } from "lucide-react";
import {
  createContext,
  forwardRef,
  type ComponentPropsWithRef,
  type ReactNode,
  useContext,
  useId,
} from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { scrollbarStyles } from "../../styles/scrollbar.styles";
import { Button } from "../button/button";
import { Icon } from "../icon/icon";
import { dataGridFilterClauseStyles } from "./dataGridFilterClause.styles";

interface ClauseContextValue {
  describedBy: string | undefined;
  disabled: boolean;
  invalid: boolean;
}

const ClauseContext = createContext<ClauseContextValue>({
  describedBy: undefined,
  disabled: false,
  invalid: false,
});

type WithoutStyles<Props> = Omit<Props, "className" | "style">;

export interface DataGridFilterClauseRootProps extends Omit<
  ComponentPropsWithRef<"div">,
  "className" | "style"
> {
  /** Disables clause editing. */
  disabled?: boolean;
  /** Marks the clause as invalid. */
  invalid?: boolean;
  /** Explains how the clause became invalid. */
  invalidDescription?: string;
}

export type DataGridFilterClauseListProps = Omit<
  ComponentPropsWithRef<"div">,
  "className" | "style"
>;

export interface DataGridFilterClauseTriggerProps extends Omit<
  WithoutStyles<BaseButton.Props>,
  "nativeButton" | "render"
> {
  /** Complete action-oriented name retained when visible content truncates. */
  "aria-label": string;
  /** Compound clause content. */
  children: ReactNode;
}

export interface DataGridFilterClauseRemoveProps extends Omit<
  ComponentPropsWithRef<"button">,
  "children" | "className" | "prefix" | "style"
> {
  /** Identifies the clause removed by this action. */
  "aria-label": string;
}

export interface DataGridFilterClausePartProps extends Omit<
  ComponentPropsWithRef<"span">,
  "className" | "style"
> {
  /** Visible clause part. */
  children: ReactNode;
}

export type DataGridFilterClauseColumnProps = DataGridFilterClausePartProps;
export type DataGridFilterClauseOperatorProps = DataGridFilterClausePartProps;
export type DataGridFilterClauseValueProps = DataGridFilterClausePartProps;

const DataGridFilterClauseList = forwardRef<HTMLDivElement, DataGridFilterClauseListProps>(
  function DataGridFilterClauseListComponent(props, ref) {
    return (
      <div
        {...props}
        ref={ref}
        role={props.role ?? "group"}
        {...stylex.props(dataGridFilterClauseStyles.list, scrollbarStyles.hidden)}
        data-scrollbar="hidden"
        data-slot="data-grid-filter-clause-list"
      />
    );
  },
);

const DataGridFilterClauseRoot = forwardRef<HTMLDivElement, DataGridFilterClauseRootProps>(
  function DataGridFilterClauseRootComponent(
    { children, disabled = false, invalid = false, invalidDescription, ...props },
    ref,
  ) {
    const generatedDescriptionId = useId();
    const descriptionId = invalidDescription === undefined ? undefined : generatedDescriptionId;
    return (
      <ClauseContext.Provider value={{ describedBy: descriptionId, disabled, invalid }}>
        <div
          {...props}
          ref={ref}
          {...stylex.props(dataGridFilterClauseStyles.root)}
          data-slot="data-grid-filter-clause"
        >
          <div
            {...stylex.props(
              dataGridFilterClauseStyles.controls,
              invalid === true && dataGridFilterClauseStyles.controlsInvalid,
            )}
          >
            {children}
          </div>
          {invalidDescription === undefined ? null : (
            <span id={descriptionId} {...stylex.props(dataGridFilterClauseStyles.invalidDescription)}>
              <Icon artwork={CircleAlert} size="xs" />
              <span>{invalidDescription}</span>
            </span>
          )}
        </div>
      </ClauseContext.Provider>
    );
  },
);

const DataGridFilterClauseTrigger = forwardRef<HTMLElement, DataGridFilterClauseTriggerProps>(
  function DataGridFilterClauseTriggerComponent(
    { disabled = false, "aria-describedby": describedBy, ...props },
    ref,
  ) {
    const context = useContext(ClauseContext);
    const effectiveDisabled = context.disabled === true || disabled === true;
    const stateStyles = createStateStyleProps<BaseButton.State>(() => [
      dataGridFilterClauseStyles.trigger,
      effectiveDisabled === true && dataGridFilterClauseStyles.triggerDisabled,
      context.invalid === true && dataGridFilterClauseStyles.triggerInvalid,
    ]);
    return (
      <BaseButton
        {...props}
        ref={ref}
        aria-describedby={[describedBy, context.describedBy].filter(Boolean).join(" ") || undefined}
        data-invalid={context.invalid === true ? "" : undefined}
        disabled={effectiveDisabled}
        nativeButton
        {...stateStyles}
        type="button"
      />
    );
  },
);

const DataGridFilterClauseRemove = forwardRef<HTMLElement, DataGridFilterClauseRemoveProps>(
  function DataGridFilterClauseRemoveComponent({ disabled = false, ...props }, ref) {
    const context = useContext(ClauseContext);
    return (
      <Button
        {...props}
        ref={ref}
        disabled={context.disabled === true || disabled === true}
        glyphSize="compact"
        iconOnly
        render={<button {...stylex.props(dataGridFilterClauseStyles.remove)} />}
        size="xs"
        variant="ghost"
      >
        <Button.Glyph artwork={X} />
      </Button>
    );
  },
);

const DataGridFilterClauseColumn = forwardRef<HTMLSpanElement, DataGridFilterClauseColumnProps>(
  function DataGridFilterClauseColumnComponent(props, ref) {
    return <span {...props} ref={ref} {...stylex.props(dataGridFilterClauseStyles.column)} />;
  },
);

const DataGridFilterClauseOperator = forwardRef<HTMLSpanElement, DataGridFilterClauseOperatorProps>(
  function DataGridFilterClauseOperatorComponent(props, ref) {
    return <span {...props} ref={ref} {...stylex.props(dataGridFilterClauseStyles.operator)} />;
  },
);

const DataGridFilterClauseValue = forwardRef<HTMLSpanElement, DataGridFilterClauseValueProps>(
  function DataGridFilterClauseValueComponent(props, ref) {
    return <span {...props} ref={ref} {...stylex.props(dataGridFilterClauseStyles.value)} />;
  },
);

export const DataGridFilterClause = Object.assign(DataGridFilterClauseRoot, {
  Root: DataGridFilterClauseRoot,
  List: DataGridFilterClauseList,
  Trigger: DataGridFilterClauseTrigger,
  Remove: DataGridFilterClauseRemove,
  Column: DataGridFilterClauseColumn,
  Operator: DataGridFilterClauseOperator,
  Value: DataGridFilterClauseValue,
});

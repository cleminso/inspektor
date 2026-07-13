import * as stylex from "@stylexjs/stylex";

import { Input, type InputProps, type InputSize } from "../input/input";
import { searchStyles } from "./search.styles";

export interface SearchProps extends Omit<InputProps, "type" | "render"> {
  /** Controls the search input height. */
  size?: InputSize;
  /** Stretches the search control to the width of its container. */
  fullWidth?: boolean;
  /** Disables editing and exposes the disabled state to assistive technology. */
  disabled?: InputProps["disabled"];
  /** Sets the initial query when uncontrolled. */
  defaultValue?: InputProps["defaultValue"];
  /** Sets the current query when controlled. */
  value?: InputProps["value"];
  /** Runs when the query changes. */
  onValueChange?: InputProps["onValueChange"];
}

export function Search({
  size = "m",
  fullWidth = true,
  disabled = false,
  ...props
}: SearchProps) {
  const rootStyleProps = stylex.props(searchStyles.root, fullWidth === true && searchStyles.fullWidth);
  const inputStyleProps = stylex.props(searchStyles.input);
  const iconStyleProps = stylex.props(searchStyles.icon, disabled === true && searchStyles.iconDisabled);

  return (
    <span {...rootStyleProps} data-slot="search">
      <Input
        {...props}
        type="search"
        size={size}
        fullWidth={fullWidth}
        disabled={disabled}
        render={<input className={inputStyleProps.className} style={inputStyleProps.style} />}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        {...iconStyleProps}
      >
        <circle cx="7" cy="7" r="4" />
        <path d="m10 10 3 3" />
      </svg>
    </span>
  );
}
